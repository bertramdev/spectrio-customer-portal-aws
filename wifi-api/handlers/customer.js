'use strict';
const auth = require("../utils/auth");
const constants = require("../utils/constants");
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB.DocumentClient();
AWS.config.region = process.env.REGION;

module.exports.default = (event, context, callback) => {
	console.log(event);
	var customerId = event.pathParameters.id,
        httpMethod = event.httpMethod,
		dynamoDbTable = constants.DYNAMODB_TABLES.customers,
        now = new Date();
    if (httpMethod == 'POST' || httpMethod == 'PUT') {
        try {
            const item = JSON.parse(event.body.replace(/""/g, 'null'));                      
            item.id = customerId;
            item.lastUpdated = now.toString();
            if (httpMethod == 'POST') item.active = true;
            var params = {
                TableName: dynamoDbTable,
                Key: {
                    id: customerId.toString()
                },
                Item: item
            };
            dynamoDb.put(params, (error) => {
                var info = {};
                if (error) {
                    console.error(error);
                    console.log('Could not save '+params.Key.id);
                    info.statusCode = 400;
                    info.success = false;
                    info.message = 'Could not save '+params.Key.id;
                    return;
                }
                else {
                    info.success = true;
                    info.statusCode = 200;
                    info.message = 'Saved '+params.Key.id;
                    console.log('Saved '+params.Key.id);
                }
                const output = {
                    statusCode: info.statusCode,
                    body: JSON.stringify(info),
                };	
                callback(null, output);
            });
        } catch(error) {
            console.log(error);
            var info = {
                success: false,
                message: error.toString()
            };
			const output = {
				statusCode: 500,//error.status,
				body: JSON.stringify(info)
			};	
			callback(null, output);
        }
    }
    else if (httpMethod == 'DELETE') {
        var item = {active:false};
        var params = {
            TableName: dynamoDbTable,
            Key: {
                id: customerId.toString()
            },
            Item: item
        };
        dynamoDb.put(params, (error) => {
            var info = {};
            if (error) {
                console.error(error);
                console.log('Could not deactivate '+params.Key.id);
                info.statusCode = 400;
                info.success = false;
                info.message = 'Could not deactivate '+params.Key.id;
                return;
            }
            else {
                info.success = true;
                info.statusCode = 200;
                info.message = 'Saved '+params.Key.id;
                console.log('Saved '+params.Key.id);
            }
            const output = {
                statusCode: info.statusCode,
                body: JSON.stringify(info),
            };	
            callback(null, output);
        });
    
    }
    else if (httpMethod == 'GET') {
        const params = {
            TableName: dynamoDbTable,
            Key: {
              id: customerId
            }
        };
        
        // delete the todo from the database
        dynamoDb.get(params, (error, data) => {
            // handle potential errors
            if (error) {
              console.error(error);
              var info = {
                  success: false,
                  statusCode:error.statusCode || 501, 
                  message: error.toString()
              }
              callback(null, {
                statusCode: info.statusCode,
//                headers: { 
//                  'Content-Type': 'text/plain',
//                  "Access-Control-Allow-Origin" : "*" // Required for CORS support to work           
//                },
                body: JSON.stringify(info)
              });
              return;
            }
            else {
                var info = {
                    success: true,
                    statusCode: 200,
                    data: data.Item
                };
                  
              const response = {
                statusCode: info.statusCode,
 //               headers: { 
 //                 "Content-Type": "application/json; charset=utf-8",
 //                 "Access-Control-Allow-Origin" : "*" // Required for CORS support to work 
 //               },
                body: JSON.stringify(info)
              };
              callback(null, response);        
            }
          });
    }
    else {
        var info = {
            success: false,
            statusCode:400, 
            message: 'HTTP method not supprted: '+httpMethod
        }
        callback(null, {
          statusCode: info.statusCode,
//                headers: { 
//                  'Content-Type': 'text/plain',
//                  "Access-Control-Allow-Origin" : "*" // Required for CORS support to work           
//                },
          body: JSON.stringify(info)
        });
        return;

    }
    
};

