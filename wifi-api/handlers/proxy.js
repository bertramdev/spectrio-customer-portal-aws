'use strict';
const auth = require("../utils/auth");

const request = require('superagent');

module.exports.default = (event, context, callback) => {
	console.log(event);

	var path = (event.queryStringParameters ? event.queryStringParameters.path : null) || '/api/company/v1/venues',
		publicKey = (event.queryStringParameters ? event.queryStringParameters.publicKey : null) || 'ca722481fcff8361d4fe2ac3a476aba4',
		privateKey = (event.queryStringParameters ? event.queryStringParameters.privateKey : null) || 'fcc4780fc12bdf89e0bc81371e45d9b3',
		now = new Date(),
		authInfo = auth.getAuthInfo(publicKey, privateKey, path, now), 
		url = 'https://'+authInfo.portalDomain+path;
	request
		.get(url)
		.accept('application/json')
		.set('Host', authInfo.portalDomain)
		.set('Content-Type', 'application/json')
		.set('Content-Length', '0')
		.set('Date', now.toUTCString()) 
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
};

