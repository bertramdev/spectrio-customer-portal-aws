'use strict';
const auth = require("../utils/auth");
const constants = require("../utils/constants");
const moment = require('moment');
const req = require('superagent');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB.DocumentClient();
AWS.config.region = process.env.REGION;

function getDailyInfo(customerId, externalId, fromString2, name) {
	return {
		id: customerId+'-'+externalId+'-'+fromString2,
		customerId: customerId,
		name: name,
		externalId: externalId,
		date: fromString2,
		visitors: 0,
		visits: 0,
		genderCaptured: 0,
		ageCaptured: 0,
		sourceCaptured: 0,
		age0to17:0,
		age18to34:0,
		age35to49:0,
		age50to70:0,
		ageOver70:0,
		male: 0,
		female: 0
	};
}

function getCallbackBody(success, statusCode, message) {
	return {
		statusCode: statusCode,
		body: JSON.stringify({
			success: success,
			statusCode:statusCode, 
			message: message
		})
	};
}

module.exports.customerVenuesDailyTotals = (event, context, callback) => {
	console.log(event);
	var customerId = event.queryStringParameters ? event.queryStringParameters.customerId : null,
		dynamoDbTable = constants.DYNAMODB_TABLES.customers;
	if (!customerId) {
		callback(null, getCallbackBody(false, error.statusCode || 400, 'Customer id missing'));
		return;
	}		
	dynamoDb.get({ TableName: dynamoDbTable, Key: { id: customerId } }, (error, data) => { // get customer record
		if (error) {
			console.error(error);
			callback(null, getCallbackBody(false, error.statusCode || 501, error.toString()));
			return;
		}
		else if (!data.Item) {
			callback(null, getCallbackBody(false, 404,  'Customer not found'));
		}
		else if (data.Item.active == false) {
			console.error(error);
			callback(null, getCallbackBody(false, error.statusCode || 501,  'Customer is not active'));
			return;
		}
		else if (!data.Item.purplePublicKey || !data.Item.purplePrivateKey) {
			console.error(error);
			callback(null, getCallbackBody(false, error.statusCode || 401, 'Customer is missing wifi access keys'));
			return;
		}
		else {
			// these are globals to request
			const publicKey = data.Item.purplePublicKey, //'ca722481fcff8361d4fe2ac3a476aba4'
				privateKey = data.Item.purplePrivateKey, //'fcc4780fc12bdf89e0bc81371e45d9b3',
				fromPrm = (event.queryStringParameters ? event.queryStringParameters.from : null),
				toPrm = (event.queryStringParameters ? event.queryStringParameters.to : null),
				fromDate = fromPrm ? moment(fromPrm, 'YYYYMMDD') : moment().add(-7, 'days'),
				toDate = toPrm ? moment(toPrm, 'YYYYMMDD') : moment(constants.MOMENTS.now)
				;

			dynamoDbTable = constants.DYNAMODB_TABLES.venues; // switch to venues table
			// query for customer venues
			const venueParams = {
				TableName : dynamoDbTable,
				KeyConditionExpression: "customerId = :customerId",
				IndexName: dynamoDbTable+'-customer-index',
				ExpressionAttributeValues: { ":customerId":customerId }
			}; 
			// being aync db query
			dynamoDb.query(venueParams, function(err, data) {
				if (err) {
					console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
				} else {
					dynamoDbTable = constants.DYNAMODB_TABLES.venueDailyTotals; // switch to daily aggregates table
					// begin loop through venues				
					data.Items.forEach(function(item) {
						let newFrom = moment(fromDate),
							count = 0;
						// begin loop through days
						while ((newFrom.isBefore(toDate) || newFrom.isSame(toDate) )) {
							// local to the loop
							let now = new Date(), // for timestamping request
								thisFrom = moment(newFrom),
								path = '/api/company/v1/venue/'+item.externalId+'/visitors?customerId='+ customerId+ '&from='+thisFrom.format('YYYYMMDD')+'&to='+thisFrom.format('YYYYMMDD'),
								authInfo = auth.getAuthInfo(publicKey, privateKey, path, now),
								header = authInfo.header,
								portalDomain = authInfo.portalDomain,
								url = 'https://'+portalDomain+path,
								externalId = item.externalId,
								name = item.name,
								fromString2 = thisFrom.format('YYYY-MM-DD');
							console.log(' querying purple API for ' + item.externalId + ' on '+fromString2);
							// begin async API query for visitors
							req
								.get(url)
								.accept('application/json')
								.retry(2) // retry a couple times incase of 502
								.set('Host', portalDomain).set('Content-Type', 'application/json').set('Content-Length', '0').set('Date', now.toUTCString()) // these are standard headers
								.set('X-API-Authorization', header) // special purple API auth header
								.then(function(res) {
									//console.log(res);
									let msg = 'Venues not found',
										successCount = 0;
									if (res.body && res.body.data && res.body.data.visitors) {
										let visitors = res.body.data.visitors,
											dailyTotals = getDailyInfo(customerId, externalId, fromString2, name);
										dailyTotals.visitors = visitors.length;
										visitors.forEach (function(visitor, i) {
											if (visitor.visits) dailyTotals.visits += visitor.visits;
											['gender', 'source'].forEach((fld)=>{
												if (visitor[fld]) {
													let fldVal  = visitor[fld];
													fldVal = fldVal == 'M' ? 'male' : fldVal; // stupid decoding gender
													fldVal = fldVal == 'F' ? 'female' : fldVal;
													dailyTotals[fld+'Captured']++;
													dailyTotals[fldVal] = dailyTotals[fldVal] || 0;
													dailyTotals[fldVal]++;
												}
											});
											if (visitor.date_of_birth) {
												try {
													let birth = moment(visitor.date_of_birth);
													dailyTotals['ageCaptured']++;
													if (birth.isAfter(constants.MOMENTS.age18Birth)) dailyTotals.age0to17++;
													else if (birth.isAfter(constants.MOMENTS.age35Birth)) dailyTotals.age18to34++;
													else if (birth.isAfter(constants.MOMENTS.age50Birth)) dailyTotals.age35to49++;
													else if (birth.isAfter(constants.MOMENTS.age70Birth)) dailyTotals.age50to70++;
													else dailyTotals.ageOver70++;
												}
												catch (e) {
													console.log(e);
												}
											}
											// store daily totales
											let params = {
												TableName: dynamoDbTable,
												Key: { id: dailyTotals.id },
												Item: dailyTotals
											};
											dynamoDb.put(params, (error) => {
												if (error) {
													console.error(error);
													console.log('Could not save with totals '+params.Key.id);
												}
												else {
													console.log('Saved with totals '+params.Key.id);
													console.log(dailyTotals);
												}
											});
											successCount++;	  
										});
									}
								})
								.catch((error) => {
									console.log(error);
									if (error.status == 404) {
										console.log('No visitors to '+ externalId + ' for '+fromString2);
									}
									const dailyTotals = getDailyInfo(customerId, externalId, fromString2, name);
									// store daily totales
									let params = {
										TableName: dynamoDbTable,
										Key: { id: dailyTotals.id.toString() },
										Item: dailyTotals
									};
									dynamoDb.put(params, (error) => {
										if (error) {
											console.error(error);
											console.log('Could not save without totals '+params.Key.id);
										}
										else {
											console.log('Saved without totals '+params.Key.id);
										}
									});
								});
							// end API query for visitors
							newFrom.add(1,'days');
							count++;
						}
						// end loop through days
					});
					// end loop through venues
					callback(null, getCallbackBody(true, 200, 'Aggregated visitors for '+data.Items.length + ' venues from '+fromDate.toString() + ' to '+toDate.toString()));					
				}
			});
			// en d async db query
		}
	});
};

