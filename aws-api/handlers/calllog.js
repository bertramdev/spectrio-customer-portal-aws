'use strict';
const auth = require("../utils/auth");
const util = require("../utils/util");
const customer = require("../handlers/customer");
const constants = require("../utils/constants");
const superagent = require('superagent');
const moment = require('moment');
const request = require('superagent');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
AWS.config.region = constants.REGION;

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const path = require('path');
const PAGE_SIZE = 250;
const sns = new AWS.SNS();

const connectionClass = require('http-aws-es');
const elasticsearch = require('elasticsearch');
const elasticClient = new elasticsearch.Client({  
    host: constants.esDomain.endpoint,
    log: constants.esDomain.log,
    connectionClass: constants.esDomain.connectionClass,
    amazonES: { credentials: new AWS.EnvironmentCredentials('AWS') }
});

function postToES(customerId, docs, tzOffset, callback) {
    var body = [],
        indices = {};
    docs.forEach(function(item) {
        if (item['@controls']) delete item['@controls'];
        if (item.extension && item.extension['@controls']) delete item.extension['@controls'];
        let m = moment(1000*item.start_time_epoch);
        if (tzOffset) m.utcOffset(tzOffset);
        item.start_hour = m.hour();
        item.start_day = m.day();
        if (item.details) {
            item.details.forEach(function(detail){
                if (detail.start_time) detail.start_time_ms = detail.start_time * 1000;
            });
        }
        let indexName = constants.esDomain.index+'_'+customerId+'_'+m.format('YYYYMM');
        body.push({"index":{"_id":item.id, "_index": indexName}});
        body.push(item);
    });
    elasticClient.bulk({refresh:true, type: constants.esDomain.doctype, body: body}, callback);
}

function searchES(customerId, query, callback) {
    query = query || {"query": { "match_all": {} }, "size":20};
    if (query instanceof String) query = JSON.parse(query);
    elasticClient.search({
        index: constants.esDomain.index+'_'+customerId+'_*',
        type: constants.esDomain.doctype,
        expandWildcards: 'all',
        allowNoIndices: true,
        body: query
      }).then(function (resp) {
          console.log(resp);
          callback(null, resp)
      }, function (err) {
          console.trace(err.message);
          callback(err, null);
      });
}

function dropES(customerId, callback) {
    let indexName = constants.esDomain.index + (customerId ? '_'+customerId+'_*' : '_*'); 
    elasticClient.indices.delete({"index":indexName}, callback);
}

// page through 250 at a time
function fetchCallLogs(customerId, url, header, offset, tzOffset) {
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
                postToES(customerId, docs, tzOffset, (err, respBody) => {
                    if (err) {
                        console.log(err);
                        console.log(' DID NOT save phone API '+docs.length+' call logs');
                    }
                    else {
                        console.log(' saved phone API '+docs.length+' call logs');
                    }
                    console.log(respBody);
                });
                if (res.body.total > (offset + PAGE_SIZE)) { // keep pagings
                    fetchCallLogs(customerId, url, header, (offset + PAGE_SIZE), tzOffset)
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

module.exports.init = (event, context, callback) => {
    elasticClient.indices.putTemplate({
        create:false,
        name: 'call_log_index_template',
        body: {
            index_patterns: [constants.esDomain.index+"*"],
            mappings: constants.CALL_LOG_MAPPINGS
        }
    }, function(err, respBody) {
        if (err) {
            console.log(err);
            callback(null, util.getCallbackBody(true, 400, 'init failed: '+err));
        }
        else {
            callback(null, util.getCallbackBody(true, 200, 'init completed: '+JSON.stringify(respBody)));
        }                    
    });

};    
module.exports.search = (event, context, callback) => {
    let customerId = event.queryStringParameters.customerId;
    if (!customerId) {
        callback(null, util.getCallbackBody(true, 400, 'customerId missing'));
        return;
    }

    searchES(customerId, event.body, (err, respBody) => {
        let output = [],
            meta = {};
        if (respBody) {
            let body = respBody instanceof String ? JSON.parse(respBody) : respBody;
            if (body.hits && body.hits.hits) {
                meta.total = body.hits.total;
                body.hits.hits.forEach((itm)=>{
                    output.push(itm._source);
                });
                output = body;
            }
            else {
                meta.total = 0;
            }
        }        
        callback(null, util.getCallbackBody(true, 200, 'Search completed', output, meta));
    });
};

function formatTimezoneOffset(offset) {
    offset = offset || 0;
    return (offset<0? '-':'+')+('0' + Math.abs(offset)).substr(-2)+':00'; 
}

function getDayName(day) {
    return constants.DAY_NAMES[day];
}
function getHourName(hour) {
    if (hour == 0) return '12AM to 1AM';
    else if (hour == 11)  return '11AM to 12AM';
    else if (hour == 12)  return '12PM to 1PM';
    else if (hour == 23) return '11PM to 12AM';
    else if (hour < 11) return hour+'AM to '+(hour+1)+ 'AM';
    else return (hour-12)+'PM to '+(hour-11)+ 'PM';
}

function formatMinuteRange(fromSec, toSec) {
    let output;
    if (!fromSec) {
        output = 'Less than ';
        let toMin = toSec / 60;
        output += toMin + ' minute'+(toMin > 1 ?'s':'');
    }
    else if (!toSec) {
        output = 'Over ';
        let fromMin = fromSec / 60;
        output += fromMin + ' minute'+(fromMin > 1?'s':'');
    }
    else {
        output = 'From ';
        let fromMin = fromSec / 60;
        output += fromMin + ' minute'+(fromMin > 1?'s to ':' to ');
        let toMin = toSec / 60;
        output += toMin +' minute'+(toMin > 1?'s':'');
    }
    return output;
}

module.exports.aggregate = (event, context, callback) => {
	console.log(event);

	let customerId = (event.queryStringParameters ? event.queryStringParameters.customerId : null),
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
		else if (!data.Item.phoneAccountId || !data.Item.phoneApiToken) {
			callback(null, util.getCallbackBody(false, 403, 'Customer is missing phone access keys'));
			return;
		}
		else {
            let fromPrm = (event.queryStringParameters ? event.queryStringParameters.from : moment().add(-7, 'days').format('YYYYMMDD')),
                toPrm = (event.queryStringParameters ? event.queryStringParameters.to : moment(constants.MOMENTS.now).format('YYYYMMDD')),
                extensionId = (event.queryStringParameters ? event.queryStringParameters.extensionId : null),
                tzOffsetString = formatTimezoneOffset(customer.timeZoneOffset);
            let query = {
                "query": {
                    "bool": {
                        "must": [ {
                            "range" : {
                                "start_time" : {
                                    "gte": fromPrm,
                                    "lte": toPrm,
                                    "format": "yyyyMMdd",
                                    "time_zone":tzOffsetString
                                }
                            }
                        } ]
                    }
                }, 
                "size":0, 
                "aggs" : {
                    "avg_call_duration" : { 
                        "avg" : { 
                            "field" : "call_duration"
                        } 
                    },
                    "call_duration_ranges" : {
                        "range" : {
                            "field" : "call_duration",
                            "ranges" : [
                                { "to" : 60.0 },
                                { "from" : 60.0, "to" : 300.0 },
                                { "from" : 300.0, "to" : 900.0 },
                                { "from" : 900.0, "to" : 1800.0 },
                                { "from" : 1800.0, "to" : 3600.0 },
                                { "from" : 3600.0 }
                            ]
                        }
                    },
                    "calls_over_time" : {
                        "date_histogram" : {
                            "field" : "start_time",
                            "interval" : "day",
                            "time_zone": tzOffsetString
                        },
                        "aggs": {
                            "date_avg_call_duration" : { 
                                "avg" : { 
                                    "field" : "call_duration"
                                }
                            }
                        }
                    },
                    "hour_count" : {
                        "histogram" : {
                            "field" : "start_hour",
                            "interval": 1
                        }
                    },
                    "day_count" : {
                        "histogram" : {
                            "field" : "start_day",
                            "interval": 1
                        }
                    },
                    "direction_count" : {
                        "terms" : {
                            "field" : "direction"
                        }
                    }
                }
            };
            if (extensionId) {
                query.query.bool.must.push({"term":{"extension.id":parseInt(extensionId)}});
            }
            searchES(customerId, query, (err, respBody) => {
                let output = {
                        calls_over_time:[['Day','Count','Average Duration']],
                        hour_count:[['Hour','Count']],
                        avg_call_duration:0,
                        direction_count:[['Direction', 'Count']],
                        call_duration_ranges:[['Range', 'Count']],
                        day_count:[['Day','Count']],
                    },
                    meta = {total:0, from:fromPrm, to:toPrm};
                if (respBody) {
                    let body = respBody instanceof String ? JSON.parse(respBody) : respBody;
                    if (body.hits) {
                        meta.total = body.hits.total;
                        output.avg_call_duration = body.aggregations.avg_call_duration.value;
                        ['direction_count','hour_count','day_count'].forEach(function(fld){
                            body.aggregations[fld].buckets.forEach(function(itm){
                                let key = itm.key;
                                if (fld == 'day_count') key = getDayName(itm.key);
                                else if (fld == 'hour_count') key = getHourName(itm.key);
                                output[fld].push([key,itm.doc_count]);
                            });
                        });
                        body.aggregations.calls_over_time.buckets.forEach(function(itm){
                            let m = moment(itm.key);
                            if (customer.timeZoneOffset) m.utcOffset(customer.timeZoneOffset)
                            let key = m.format('MMM D');
                            output.calls_over_time.push([key, itm.doc_count, itm.date_avg_call_duration.value]);
                        });
                        body.aggregations.call_duration_ranges.buckets.forEach(function(itm){
                            let key = formatMinuteRange(itm.from, itm.to);
                            output.call_duration_ranges.push([key, itm.doc_count]);
                        });
                    }
                    else {
                        meta.total = 0;
                    }
                }        
                callback(null, util.getCallbackBody(true, 200, 'Aggregation completed', output, meta));
            });
                    
		}
	});

};

module.exports.post = (event, context, callback) => {
    const item = JSON.parse(event.body);//.replace(/""/g, 'null'));
    const customerId = event.queryStringParameters.customerId;
    postToES(customerId, [item], function(err, respBody) {
        callback(null, util.getCallbackBody(true, 200, 'Post completed: '+JSON.stringify(respBody)));
    });
};

module.exports.updateMapping = (event, context, callback) => {
    elasticClient.indices.putMapping({
        index: constants.esDomain.index+'*',
        allowNoIndices: true,
        expandWildcards: 'all',
        updateAllTypes: true,
        type: constants.esDomain.doctype,
        body: constants.CALL_LOG_MAPPINGS.call_log
    }, function(err, respBody) {
        if (err) {
            console.log(err);
            callback(null, util.getCallbackBody(true, 400, 'updateMapping failed: '+err));
        }
        else {
            callback(null, util.getCallbackBody(true, 200, 'updateMapping completed: '+JSON.stringify(respBody)));
        }                    
    });
};

module.exports.drop = (event, context, callback) => {
    let customerId = event.queryStringParameters.customerId;
    if (!customerId) {
        callback(null, util.getCallbackBody(true, 400, 'customerId missing'));
        return;
    }
    dropES(customerId, function(err, respBody) {
        if (err) {
            console.log(err);
            callback(null, util.getCallbackBody(true, 400, 'Drop failed: '+err));
        }
        else {
            callback(null, util.getCallbackBody(true, 200, 'Drop completed: '+JSON.stringify(respBody)));
        }
    });
};

module.exports.dropAll = (event, context, callback) => {
    dropES(null, function(err, respBody) {
        if (err) {
            console.log(err);
            callback(null, util.getCallbackBody(true, 400, 'Drop failed: '+err));
        }
        else {
            callback(null, util.getCallbackBody(true, 200, 'Drop completed: '+JSON.stringify(respBody)));
        }
    });
};

function importCustomerCallLogs(customer, fromDate, toDate) {
    if (!customer) {
        return util.getCallbackBody(false, 404,  'Customer not found');
    }
    else if (customer.active == false) {
        return util.getCallbackBody(false, error.statusCode || 501,  'Customer is not active');
    }
    else if (!customer.phoneApiToken || !customer.phoneAccountId) {
        return util.getCallbackBody(false, error.statusCode || 401, 'Customer is missing voip access keys');
    }
    else {
        // these are globals to request
        toDate = toDate || moment(fromDate).add(1, 'days');
        const phoneApiToken = customer.phoneApiToken, 
            phoneAccountId = customer.phoneAccountId, 
            header = 'Bearer '+phoneApiToken,
            url = 'https://api.phone.com/v4/accounts/'+phoneAccountId+'/call-logs?filters[start_time]=between:'+fromDate.unix()+','+toDate.unix()+'&limit='+PAGE_SIZE;
        // begin async API query for call logs
        fetchCallLogs(customer.id, url, header, 0, customer.timeZoneOffset);
        // end loop through days
        return util.getCallbackBody(true, 200, 'Imported call logs for account '+phoneAccountId + ' from '+fromDate.toString() + ' to '+toDate.toString());					
    }    
}

module.exports.import = (event, context, callback) => {
    console.log(event);
    var prmSet = []
    if (event.Records) {
        event.Records.forEach(function(rec) {
            if (rec.Sns) prmSet.push(JSON.parse(rec.Sns.Message));
        });
    }
    else{
        prmSet.push(event.queryStringParameters);
    }
    prmSet.forEach(function(prms){
        var customerId = (prms ? prms.customerId : null);
        
        if (!customerId) {
            callback(null, util.getCallbackBody(false, error.statusCode || 400, 'Customer id missing'));
            return;
        }
        const fromPrm = (prms ? prms.from : null),
            fromDate = fromPrm ? moment(fromPrm, 'YYYYMMDD') : moment(constants.MOMENTS.now).set({hour:0,minute:0,second:0,millisecond:0}).add(-1, 'days'),
            toPrm = (prms ? prms.to : null),
            toDate = toPrm ? moment(toPrm, 'YYYYMMDD') : moment(constants.MOMENTS.now).set({hour:0,minute:0,second:0,millisecond:0}),
            dynamoDbTable = constants.DYNAMODB_TABLES.customers;
        dynamoDb.get({ TableName: dynamoDbTable, Key: { id: customerId } }, (error, data) => { // get customer record
            if (error) {
                console.error(error);
                callback(null, util.getCallbackBody(false, error.statusCode || 501, error.toString()));
                return;
            }
            importCustomerCallLogs(data.Item, fromDate, toDate);
        });
    });
    callback(null, util.getCallbackBody(true, 200, 'Importing call logs'));
};

module.exports.importAll = (event, context, callback) => {
    console.log('calllog.importAll');
    customer.fetch(null, function(err, data) {
        if (err) {
            callback(null, util.getCallbackBody(true, 400, err));
        }
        else {
            data.forEach(function(customer){
                if (customer.phoneAccountId && customer.phoneApiToken) {
                    let msg = {
                        customerId: customer.id,
                        from: event.queryStringParameters ? event.queryStringParameters.from : null,
                        to: event.queryStringParameters ? event.queryStringParameters.to : null
                    }         
                    console.log('triggering importing for ' + customer.customerName+ ' from '+msg.from+ ' to '+msg.to);
                    sns.publish({ Message:JSON.stringify(msg), TopicArn: process.env.IMPORT_CALL_LOGS_TOPIC }, (error) => {
                        if (error) console.error(error);
                    });
                }
            });
            callback(null, util.getCallbackBody(true, 200, 'Importing all all customer call logs'));
        }
    });
};    
