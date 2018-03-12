'use strict';
const request = require('superagent');
const sha256 = require('js-sha256');

var publicKey = 'ca722481fcff8361d4fe2ac3a476aba4',
	privateKey = 'fcc4780fc12bdf89e0bc81371e45d9b3',
	companyId = '4286',
	portalDomain = 'region1.purpleportal.net';

//'X-API-Authorization'
function getAuth(path, now, postString) {
	postString = postString || '';
	var nowString = now.toUTCString(),
		hashString = 'application/json\n'+
		portalDomain+'\n'+
		path+'\n'+
		nowString + '\n'+
		postString +'\n';
	console.log('\n'+hashString);
	var hash = sha256.hmac(privateKey, hashString);
	var header = publicKey+':'+hash;
	return {header:header, hashString: hashString};
}

module.exports.purpleProxy = (event, context, callback) => {
	console.log(event);
	var path = (event.queryStringParameters ? event.queryStringParameters.path : null) || '/api/company/v1/venues',
		url = 'https://'+portalDomain+path,
		now = new Date(),
		authInfo = getAuth(path, now);
	console.log(path);
	console.log(url);
	console.log(authInfo);
	request
		.get(url)
		.accept('application/json')
		.set('Host', portalDomain)
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
