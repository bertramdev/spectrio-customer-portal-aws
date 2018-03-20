'use strict';
const auth = require("../utils/auth");
const util = require("../utils/util");
const constants = require("../utils/constants");
const req = require('superagent');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB.DocumentClient();
AWS.config.region = process.env.REGION;

module.exports.default = (event, context, callback) => {
	console.log(event);
	var customerId = event.queryStringParameters ? event.queryStringParameters.customerId : null,
		dynamoDbTable = constants.DYNAMODB_TABLES.customers;

	if (!customerId) {
		var info = {
			success: false,
			statusCode:error.statusCode || 404, 
			message: 'Customer id not found'
		}
		callback(null, {
			statusCode: info.statusCode,
			headers: {
				"Access-Control-Allow-Origin" : "*", // Required for CORS support to work
				"Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
			},	
			body: JSON.stringify(info)
		});
		return;
	}
		
	const params = {
		TableName: dynamoDbTable,
		Key: {
			id: customerId
		}
	};
	dynamoDb.get(params, (error, data) => {
		if (error) {
			console.error(error);
			var info = {
				success: false,
				statusCode:error.statusCode || 501, 
				message: error.toString()
			}
			callback(null, {
				statusCode: info.statusCode,
				headers: {
					"Access-Control-Allow-Origin" : "*", // Required for CORS support to work
					"Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
				},		
				body: JSON.stringify(info)
			});
			return;
		}
		else if (data.Item.active == false) {
			console.error(error);
			var info = {
				success: false,
				statusCode:error.statusCode || 501, 
				message: 'Customer is not active'
			}
			callback(null, {
				statusCode: info.statusCode,
				headers: {
					"Access-Control-Allow-Origin" : "*", // Required for CORS support to work
					"Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
				},		
				body: JSON.stringify(info)
			});
			return;
		}
		else if (!data.Item.purplePublicKey || !data.Item.purplePrivateKey) {
			console.error(error);
			var info = {
				success: false,
				statusCode:error.statusCode || 403, 
				message: 'Customer is missing wifi access keys'
			}
			callback(null, {
				statusCode: info.statusCode,
				headers: {
					"Access-Control-Allow-Origin" : "*", // Required for CORS support to work
					"Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
				},		
				body: JSON.stringify(info)
			});
			return;
		}
		else {
			var path = (event.queryStringParameters ? event.queryStringParameters.path : null) || '/api/company/v1/venues',
				venueId = (event.queryStringParameters ? event.queryStringParameters.venueId : null),
				publicKey = data.Item.purplePublicKey, //'ca722481fcff8361d4fe2ac3a476aba4'
				privateKey = data.Item.purplePrivateKey, //'fcc4780fc12bdf89e0bc81371e45d9b3',
				dataField = (event.queryStringParameters ? event.queryStringParameters.dataField : null) || 'venues',
				now = new Date(),
				authInfo = auth.getAuthInfo(publicKey, privateKey, path, now), 
				url = 'https://'+authInfo.portalDomain+path
				;
			dynamoDbTable = constants.DYNAMODB_TABLES[dataField];
			if (!venueId) {
				var pathParts = path.split('/'),
					venuePart = false;
				console.log('pathParts='+pathParts);
					
				for (var i = 0; i < pathParts.length; i++) {
					var part = pathParts[i];
					if (part == 'venue') {
						venuePart = true;
					}
					else if (venuePart) {
						venueId = part;
						break;
					}
				}
			}
			console.log('venueId='+venueId);
			req
				.get(url)
				.accept('application/json')
				.set('Host', authInfo.portalDomain)
				.set('Content-Type', 'application/json')
				.set('Content-Length', '0')
				.set('Date', now.toUTCString()) 
				.set('X-API-Authorization', authInfo.header)
				.then(function(res) {
					console.log(res.body);
					var msg = dataField+' not found',
						successCount = 0;
					if (res.body && res.body.data && res.body.data[dataField]) {
						var items = res.body.data[dataField];
						for (var i = 0; i < items.length; i++) {
							var item = items[i];
							item.customerId = customerId;
							item.externalId = item.id.toString();
							item.id = customerId+'-'+item.externalId;
							item.venueId = venueId;
							for (var k in item) {
								if (item[k] == '') item[k] = null;
							}
							console.log(item);
							var params = {
								TableName: dynamoDbTable,
								Key: {
								id: item.id.toString()
								},
								Item: item
							};
							dynamoDb.put(params, (error) => {
								// handle potential errors
								if (error) {
									console.error(error);
									console.log('Could not save '+params.Key.id);
									return;
								}
								else {
									console.log('Saved '+params.Key.id);
								}
							});
							successCount++;	  
						}
						msg = successCount + ' ' + dataField + ' saved.';
					}
					const output = {
						statusCode: 200,
						headers: {
							"Access-Control-Allow-Origin" : "*", // Required for CORS support to work
							"Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
						},				
						body: JSON.stringify({
							statusCode: 200,
							success:true,
							message:msg
						})
					};	
					callback(null, output);
				})
				.catch((error) => {
					console.log(error);
					var info = {};
					if (error.response.text) {
						info = JSON.parse(error.response.text);
					}
					else {
						info.response_code = error.response.status;
						info.success = false;
						info.message = error.message;
						info.timestamp = now;
					}
					info.auth = authInfo;
					const output = {
						statusCode: 200,//error.status,
						headers: {
							"Access-Control-Allow-Origin" : "*", // Required for CORS support to work
							"Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
						},				
						body: JSON.stringify(info)
					};	
					callback(null, output);
				});
		}
	});
};

