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
    util.getCustomerData(event, function(error, customer){
		if (error) {			console.error(error);
			callback(null, util.getCallbackBody(false, 501, error.toString()));			
			return;
		}
		else if (!customer.purplePublicKey || !customer.purplePrivateKey) {
			callback(null, util.getCallbackBody(false, 403, 'Customer is missing wifi access keys'));
			return;
		}
		else {
			var publicKey = customer.purplePublicKey, //'ca722481fcff8361d4fe2ac3a476aba4'
				privateKey = customer.purplePrivateKey, //'fcc4780fc12bdf89e0bc81371e45d9b3',
				path = (event.queryStringParameters ? event.queryStringParameters.path : null) || '/api/company/v1/venues',
				now = new Date(),
				bodyString = event.body instanceof Object ? JSON.stringify(event.body) : (event.body ? event.body.toString() : ''),
				authInfo = auth.getAuthInfo(publicKey, privateKey, path, now, bodyString),
				accept = (event.headers ? event.headers['Accept'] : null) || 'application/json',
				contentType = (event.headers ? event.headers['Content-Type'] : null) || 'application/json',
				url = 'https://'+authInfo.portalDomain+path;				
			console.log(authInfo);
			console.log(url);
			request
				.get(url)
				.timeout({
					response: 25000,
					deadline: 28000
				})
				.accept(accept)
				.set('Host', authInfo.portalDomain)
				.set('Content-Type', contentType)
				.set('Content-Length', bodyString.length.toString())
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
					if (error.response && error.response.text) {
						info = JSON.parse(error.response.text);
					}
					else {
						info.response_code = error.response ? error.response.status : 500;
						info.success = false;
						info.message = error.message;
						info.timestamp = now;
					}
					callback(null, util.getCallbackBody(false, info.response_code || 500, error.message, info));
				});
		}
	});        
};

