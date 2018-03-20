'use strict';
const auth = require("../utils/auth");
const util = require("../utils/util");
const constants = require("../utils/constants");

const request = require('superagent');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB.DocumentClient();
AWS.config.region = process.env.REGION;

module.exports.default = (event, context, callback) => {
	console.log(event);

	var customerId = (event.queryStringParameters ? event.queryStringParameters.customerId : null),
		dynamoDbTable = constants.DYNAMODB_TABLES.customers;
	if (!customerId) {
		callback(null, util.getCallbackBody(false, 400, 'Customer Id could not be found'));
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
			callback(null, util.getCallbackBody(false, error.statusCode || 501, error.toString()));			
			return;
		}
		else if (data.Item.active == false) {
			callback(null, util.getCallbackBody(false, 401, 'Customer is not active'));
			
			return;
		}
		else if (!data.Item.purplePublicKey || !data.Item.purplePrivateKey) {
			callback(null, util.getCallbackBody(false, 403, 'Customer is missing wifi access keys'));
			return;
		}
		else {
			var publicKey = data.Item.purplePublicKey, //'ca722481fcff8361d4fe2ac3a476aba4'
				privateKey = data.Item.purplePrivateKey, //'fcc4780fc12bdf89e0bc81371e45d9b3',
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
						headers: {
							"Access-Control-Allow-Origin" : "*", // Required for CORS support to work
							"Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
						},				
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
					callback(null, util.getCallbackBody(false, 500, error.message, info));
				});
		}
	});

};

