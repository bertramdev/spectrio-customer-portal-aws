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
var constants;
var moment;
var dynamoDb;
var AWS;
var auth;

function getElasticClient() {
	if (!_elasticClient) {
		let elasticsearch = require('elasticsearch');
		AWS = AWS || require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
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

module.exports.searchES = function(customerId, indexPrefix, timeBased, docType, query, callback) {
	query = query || {"query": { "match_all": {} }, "size":20};
	if (query['Spectrio-Portal-Auth']) delete query['Spectrio-Portal-Auth'];
    if (query instanceof String) query = JSON.parse(query);
    getElasticClient().search({
        index: indexPrefix+'_'+customerId+(timeBased?'_*':''),
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

module.exports.getCustomerData = function(event, callback) {
	//look for auth first
	let encryptedAuthString
	if (event.headers && event.headers['Spectrio-Portal-Auth']) {
		encryptedAuthString = event.headers['Spectrio-Portal-Auth'];
	}
	if (!encryptedAuthString && 
		event.queryStringParameters && 
		event.queryStringParameters['Spectrio-Portal-Auth']) {
		encryptedAuthString = event.queryStringParameters['Spectrio-Portal-Auth'];
	}
	if (encryptedAuthString) {
		console.log('found encrypted string: '+encryptedAuthString);
		auth = auth || require("../utils/auth");
		try {
			let customer = auth.decryptObject(encryptedAuthString);
			console.log('found customer: '+JSON.stringify(customer));
			if (!customer) {
				callback('Customer not found', null);
			}
			else if (customer.timestamp < (new Date().getTime() - 300000)) {
				callback(null, customer);
			}
			else {
				callback(null, customer);
			}
		}
		catch(ex) {
			callback(ex, null);			
		}
		return;
	}
	// temporary no security stuff
	let customerId;
	if (event.headers) {
		customerId = event.headers['customerId'];
	}
	if (!customerId && event.queryStringParameters) {
		customerId = event.queryStringParameters.customerId;
	}
	if (!customerId && event.body) {
		customerId = event.body.customerId;
	}
	if (!customerId) {
		callback('Customer id not found', null);
		return;
	}
	AWS = AWS || require('aws-sdk'); 
	AWS.config.region = process.env.REGION;

	dynamoDb = dynamoDb || new AWS.DynamoDB.DocumentClient();
	const params = {
		TableName: process.env.DYNAMODB_CUSTOMERS_TABLE,
		Key: {
			id: customerId
		}
	};
        
	dynamoDb.get(params, (error, data) => {
		if (error) {
			console.error(error);
			callback(error, null);			
			return;
		}
		else if (!data.Item) {
			callback('Customer not found', null);
			return;
		}
		else if (data.Item.active == false) {
			callback('Customer is not active', null);			
			return;
		}
		else {
			callback(null, data.Item);
			return;
		}
	});
};