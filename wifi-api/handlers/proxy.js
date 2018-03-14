'use strict';
const auth = require("../utils/auth");
const constants = require("../utils/constants");

const request = require('superagent');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB.DocumentClient();
AWS.config.region = process.env.REGION;

module.exports.default = (event, context, callback) => {
	console.log(event);

	var customerId = (event.queryStringParameters ? event.queryStringParameters.customerId : null) || '4286',
		dynamoDbTable = constants.DYNAMODB_TABLES.customers;

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
				body: JSON.stringify(info)
			});
			return;
		}
		else {
			var publicKey = data.Item.publicKey, //'ca722481fcff8361d4fe2ac3a476aba4'
				privateKey = data.Item.privateKey, //'fcc4780fc12bdf89e0bc81371e45d9b3',
				path = (event.queryStringParameters ? event.queryStringParameters.path : null) || '/api/company/v1/venues',
				now = new Date(),
				authInfo = auth.getAuthInfo(publicKey, privateKey, path, now), 
				url = 'https://'+authInfo.portalDomain+path;
			
			request
				.get(url)
				.accept('application/json')
				.set('Host', authInfo.portalDomain)
				.set('Content-Type', 'application/json')
				.set('Content-Length', '0')
				.set('Date', authInfo.now.toUTCString()) 
				.set('X-API-Authorization', authInfo.header)
				.then(function(res) {
					console.log(res);
					const output = {
						statusCode: 200,
						body: res.text,
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
						body: JSON.stringify(info)
					};	
					callback(null, output);
				});
		}
	});

};

