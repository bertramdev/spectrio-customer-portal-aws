module.exports.getCallbackBody = function(success, statusCode, message, data, meta) {
	let output = {
		statusCode: statusCode,
		headers: {
			"Access-Control-Allow-Origin" : "*", // Required for CORS support to work
			"Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
		},
		body: JSON.stringify({
			success: success,
			statusCode:statusCode, 
			message: message,
			data: (data||null),
			meta: (meta||null)
		})
	};
	return output;
}

var _elasticClient;
var moment;

function getElasticClient() {
	if (!_elasticClient) {
		let elasticsearch = require('elasticsearch');
		let AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
		AWS.config.region = process.env.REGION;
		
		_elasticClient = new elasticsearch.Client({  
			host: process.env.ELASTIC_URL,
			log: 'error',
			connectionClass: require('http-aws-es'),
			amazonES: { credentials: new AWS.EnvironmentCredentials('AWS') }
		});
	}
	return _elasticClient;		
}

module.exports.postToES = function(customerId, indexPrefix, docType, docs, callback) {
    var body = [],
		indices = {};
	moment = moment || require('moment');	
    docs.forEach(function(item) {
        let m = item.timestamp ? moment(item.timestamp) : null;		
		let indexName = indexPrefix+'_'+customerId+(m ? '_'+m.format('YYYYMM') : '');
        body.push({"index":{"_id":item.id, "_index": indexName}});
        body.push(item);
    });
    getElasticClient().bulk({refresh:true, type: docType, body: body}, callback);
}

module.exports.searchES = function(customerId, indexPrefix, docType, query, callback) {
    query = query || {"query": { "match_all": {} }, "size":20};
    if (query instanceof String) query = JSON.parse(query);
    getElasticClient().search({
        index: indexPrefix+'_'+customerId+'_*',
        type: docType,
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

module.exports.dropES = function(customerId, indexPrefix, callback) {
    let indexName = indexPrefix + (customerId ? '_'+customerId+'_*' : '_*'); 
    getElasticClient().indices.delete({"index":indexName}, callback);
}


module.exports.putESTemplate = function(name, indexPattern, mappings, callback) {
    getElasticClient().indices.putTemplate({
        create:false,
        name: name,
        body: {
            index_patterns: [indexPattern],
            mappings: mappings
        }
    }, callback);

};
