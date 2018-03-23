'use strict';
const auth = require("../utils/auth");
const util = require("../utils/util");
const constants = require("../utils/constants");
const superagent = require('superagent');
const moment = require('moment');

const request = require('superagent');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB.DocumentClient();
AWS.config.region = constants.REGION;

const path = require('path');
const PAGE_SIZE = 250;
/* == Globals == */
const esDomain = {
    region: constants.REGION,
    endpoint: constants.ELASTIC_URL,
    index: 'call_logs',
    doctype: 'call_log'
};
const endpoint = new AWS.Endpoint(esDomain.endpoint);
const creds = new AWS.EnvironmentCredentials('AWS');

function callES(method, pth, payload, callback) {
    var req = new AWS.HttpRequest(endpoint);
    req.method = method;
    req.path = pth;
    req.region = esDomain.region;
    req.headers['presigned-expires'] = false;
    req.headers['Host'] = endpoint.host;
    req.headers['Content-Type'] = 'application/json';
    if (payload) req.body = payload;
    var signer = new AWS.Signers.V4(req , 'es');  // es: service code
    signer.addAuthorization(creds, new Date());
    var send = new AWS.NodeHttpClient();
    send.handleRequest(req, null, function(httpResp) {
        var respBody = '';
        httpResp.on('data', function (chunk) {
            respBody += chunk;
        });
        httpResp.on('end', function (chunk) {
            console.log('Response: ' + respBody);
            if (callback) callback(null, respBody);
        });
    }, function(err) {
        console.log('Error: ' + err);
        if (callback) callback(err, null);
    });    
}

function postToES(docs, callback) {
    var payload = '';
    docs.forEach(function(item) {
        payload += '{"index":{"_id":"'+item.id+'"}}\n';
        if (item['@controls']) delete item['@controls'];
        if (item.extension && item.extension['@controls']) delete item.extension['@controls'];
        payload += (JSON.stringify(item)+'\n');
    });
    callES( 'POST',  path.join('/', esDomain.index, esDomain.doctype, '_bulk'), payload, callback);
}

function searchES(query, callback) {
    query = query || '{"query": { "match_all": {} }';
    callES( 'GET',  path.join('/', esDomain.index,'_search?q=*'), null, callback);
}

function dropES(callback) {
    callES( 'DELETE',  path.join('/', esDomain.index), null, callback);
}

// page through 250 at a time

function fetchCallLogs(url, header, offset) {
    offset = offset || 0;
    console.log(url+'&offset='+offset);
    superagent
        .get(url+'&offset='+offset)
        .accept('application/json')
        .retry(2) // retry a couple times incase of 502
        .set('Content-Type', 'application/json').set('Content-Length', '0').set('Date', new Date().toUTCString()) // these are standard headers
        .set('Authorization', header) // special purple API auth header
        .then((res) => {
            //console.log(res);
            if (res.body && res.body.items) {
                let docs = res.body.items;
                console.log(' found phone API '+docs.length+' call logs');
                postToES(docs, (err, respBody) => {
                    console.log(' saved phone API '+docs.length+' call logs');
                });
                if (res.body.total > (offset + PAGE_SIZE)) { // keep pagings
                    fetchCallLogs(url, header, (offset + PAGE_SIZE))
                }
            }
            else {
                console.log(' no phone API call logs to save');
            }
        })
        .catch((error) => {
            if (error.status == 404) {
                console.log('No call logs found');
            }
            else {
                console.log('Problem looking for call logs');
            }
            console.log(error);
        });
}

module.exports.get = (event, context, callback) => {
    searchES(event.body, (err, respBody) => {
        let output = [],
            meta = {};
        if (respBody) {
            let body = JSON.parse(respBody);
            meta.total = body.hits.total;
            body.hits.hits.forEach((itm)=>{
                output.push(itm._source);
            });
        }        
        callback(null, util.getCallbackBody(true, 200, 'Search completed', output, meta));
    });
};

module.exports.post = (event, context, callback) => {
    const item = JSON.parse(event.body);//.replace(/""/g, 'null'));                      
    postToES([item], function(err, respBody) {
        callback(null, util.getCallbackBody(true, 200, 'Post completed: '+respBody));
    });
};

module.exports.drop = (event, context, callback) => {
    dropES(function(err, respBody) {
        callback(null, util.getCallbackBody(true, 200, 'Drop completed: '+respBody));
    });
};

module.exports.import = (event, context, callback) => {
	console.log(event);
	var customerId = event.queryStringParameters ? event.queryStringParameters.customerId : null,
		dynamoDbTable = constants.DYNAMODB_TABLES.customers;
	if (!customerId) {
		callback(null, util.getCallbackBody(false, error.statusCode || 400, 'Customer id missing'));
		return;
	}		
	dynamoDb.get({ TableName: dynamoDbTable, Key: { id: customerId } }, (error, data) => { // get customer record
		if (error) {
			console.error(error);
			callback(null, util.getCallbackBody(false, error.statusCode || 501, error.toString()));
			return;
		}
		else if (!data.Item) {
			callback(null, util.getCallbackBody(false, 404,  'Customer not found'));
		}
		else if (data.Item.active == false) {
			console.error(error);
			callback(null, util.getCallbackBody(false, error.statusCode || 501,  'Customer is not active'));
			return;
		}
		else if (!data.Item.phoneApiToken || !data.Item.phoneAccountId) {
			console.error(error);
			callback(null, util.getCallbackBody(false, error.statusCode || 401, 'Customer is missing voip access keys'));
			return;
		}
		else {
			// these are globals to request
			const phoneApiToken = data.Item.phoneApiToken, 
                phoneAccountId = data.Item.phoneAccountId, 
                header = 'Bearer '+phoneApiToken,
				fromPrm = (event.queryStringParameters ? event.queryStringParameters.date : null),
                fromDate = fromPrm ? moment(fromPrm, 'YYYYMMDD') : moment(constants.MOMENTS.now).set({hour:0,minute:0,second:0,millisecond:0}).add(-1, 'days'),
                toDate = moment(fromDate).add(1, 'days'),
                rangeString = fromDate.format('YYYY-MM-DD') + ' to '+toDate.format('YYYY-MM-DD'),
                url = 'https://api.phone.com/v4/accounts/'+phoneAccountId+'/call-logs?filters[start_time]=between:'+fromDate.unix()+','+toDate.unix()+'&limit='+PAGE_SIZE;
            
            console.log(' querying phone API for call logs for ' + phoneAccountId + ' between '+rangeString);
            // begin async API query for call logs
            fetchCallLogs(url, header, 0);
            // end loop through days
            callback(null, util.getCallbackBody(true, 200, 'Imported call logs for account '+phoneAccountId + ' from '+fromDate.toString() + ' to '+toDate.toString()));					
		}
	});

};
