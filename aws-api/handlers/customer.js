'use strict';
const auth = require("../utils/auth");
const util = require("../utils/util");
const constants = require("../utils/constants");
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB.DocumentClient();
AWS.config.region = process.env.REGION;

module.exports.fetch = (customerId, callback, startKey, pageSize) => {
    const dynamoDbTable = constants.DYNAMODB_TABLES.customers;
    const params = {
        TableName: dynamoDbTable
    };
    if (customerId) {
		params.FilterExpression = "id = :id"
        params.ExpressionAttributeValues = { ":id":customerId};
    }
    else if (startKey) {
        params.ExclusiveStartKey = startKey;
    }
    params.PageSize = pageSize || 20;
    console.log(customerId);
    // delete the todo from the database
    dynamoDb.scan(params, (error, data) => {
        // handle potential errors
        console.log(error);
        console.log(data);
        if (error) {
            console.log(error);
            callback(error, null, null);
        }
        else {
            console.log(data);
            callback(null, data.Items, data.LastEvaluatedKey);
        }
      });
}

module.exports.default = (event, context, callback) => {
	console.log(event);
	var customerId = event.pathParameters ? event.pathParameters.id : null,
        httpMethod = event.httpMethod,
		dynamoDbTable = constants.DYNAMODB_TABLES.customers,
        now = new Date();
    if (httpMethod == 'POST') {
        try {
            const item = JSON.parse(event.body.replace(/""/g, 'null'));                      
            item.id = customerId;
            item.lastUpdated = now.toString();
            item.active = true;
            var params = {
                TableName: dynamoDbTable,
                Key: {
                    id: customerId.toString()
                },
                Item: item
            };
            dynamoDb.put(params, (error) => {
                let statusCode = 200,
                    success = true,
                    message;
                if (error) {
                    console.error(error);
                    statusCode = 400;
                    success = false;
                    message = 'Could not save '+params.Key.id + ': '+error.toString();
                }
                else {
                    console.log('Saved '+params.Key.id);
                    message = 'Saved '+params.Key.id;
                }
                callback(null, util.getCallbackBody(success, statusCode, message));
            });
        } catch(error) {
            console.log(error);
            callback(null, util.getCallbackBody(false, 500, error.toString()));            
        }
    }
    else if (httpMethod == 'PUT') {
        try {
            const item = JSON.parse(event.body.replace(/""/g, 'null'));                      
            item.id = customerId;
            item.lastUpdated = now.toString();
            var params = {
                TableName: dynamoDbTable,
                Key: {
                    id: customerId.toString()
                },
                ReturnValues:"UPDATED_NEW",
                UpdateExpression: null,
                ExpressionAttributeValues:{
                }
            };
            for (var k1 in item) {
                if (k1 != 'id') {
                    if (!params.UpdateExpression) {
                        params.UpdateExpression = 'set ';
                    }
                    else {
                        params.UpdateExpression += ', ';
                    }
                    params.UpdateExpression += (k1 + ' = :'+k1+'Prm');
                    params.ExpressionAttributeValues[':'+k1+'Prm'] = item[k1];    
                }
            }
            console.log(params);
            dynamoDb.update(params, (error, data) => {
                let statusCode = 200,
                    success = true,
                    message;
                if (error) {
                    console.error(error);
                    statusCode = 400;
                    success = false;
                    message = 'Could not update '+params.Key.id + ': '+error.toString();
                }
                else {
                    console.log('Updated '+params.Key.id);
                    message = 'Updated '+params.Key.id;
                }
                callback(null, util.getCallbackBody(success, statusCode, message));
            });
        } catch(error) {
            console.log(error);
            callback(null, util.getCallbackBody(false, 500, error.toString()));
        }
    }
    else if (httpMethod == 'DELETE') {
        var item = {active:false};
        var params = {
            TableName: dynamoDbTable,
            Key: {
                id: customerId.toString()
            },
            AttributeUpdates: {
                active: {
                    Action: 'PUT',
                    Value:true
                }
            }
        };
        dynamoDb.update(params, (error) => {
            let statusCode = 200,
                success = true,
                message;
            if (error) {
                console.error(error);
                statusCode = 400;
                success = false;
                message = 'Could not deactivate '+params.Key.id + ': '+error.toString();
                return;
            }
            else {
                console.log('Deactivated '+params.Key.id);
                message = 'Deactivated '+params.Key.id;
            }
            callback(null, util.getCallbackBody(success, statusCode, message));
        });
    
    }
    else if (httpMethod == 'GET') {
        var lastKey = event.queryStringParameters ? event.queryStringParameters.lastKey : null,
            pageSize = event.queryStringParameters ? event.queryStringParameters.pageSize : null;
        
        module.exports.fetch(customerId, function(err, data, lastKey) {
//            console.log(data);
            if (err) {
                console.log(err);
                callback(null, util.getCallbackBody(false, 200, error.toString()));
            }
            else if (customerId) {
                let item = data.length > 0 ? data[0] : null;
                callback(null, util.getCallbackBody(true, 200, 'Customer retrieved', item));
            }
            else {
                callback(null, util.getCallbackBody(true, 200, 'Customers retrieved', data, {lastKey: lastKey}));
            }
        }, lastKey, pageSize);
    }
    else {
        callback(null, util.getCallbackBody(false, 400, 'HTTP method not supprted: '+httpMethod));        
        return;
    }    
};

