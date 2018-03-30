const moment = require('moment');

module.exports.DYNAMODB_TABLES = {
	"customers": process.env.DYNAMODB_CUSTOMERS_TABLE,
	"venues": process.env.DYNAMODB_VENUES_TABLE,
	"venueDailyTotals": process.env.DYNAMODB_VENUE_DAILY_TOTALS_TABLE,
	"customerDailyTotals": process.env.DYNAMODB_CUSTOMER_DAILY_TOTALS_TABLE,
	"visitors": process.env.DYNAMODB_VISITORS_TABLE,
	"visits": process.env.DYNAMODB_VISITS_TABLE
};

const now = new Date();

module.exports.MOMENTS = {
	now: moment(now),
	age13Birth: moment(now).add(-13, 'years'), 
	age18Birth: moment(now).add(-18, 'years'), 
	age25Birth: moment(now).add(-25, 'years'),
	age35Birth: moment(now).add(-35, 'years'),
	age45Birth: moment(now).add(-45, 'years'),
	age55Birth: moment(now).add(-55, 'years'),
	age65Birth: moment(now).add(-65, 'years')
};

module.exports.ELASTIC_URL = process.env.ELASTIC_URL;
module.exports.REGION = process.env.REGION;


module.exports.esDomain = {
    region: module.exports.REGION,
    endpoint: module.exports.ELASTIC_URL,
    index: 'call_logs',
    doctype: 'call_log',
    log: 'error',
    connectionClass: require('http-aws-es')
};
module.exports.DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

module.exports.CALL_LOG_MAPPINGS = {
	"call_log" : {
		"properties" : {
			"id" : {
				"type": "keyword",
				"index": true
            },
			"caller_id" : {
				"type": "text",
				"index": true
			},
			"called_number" : {
				"type": "text",
				"index": true
			},
			"start_time" : {
				"type" : "date"
			},
			"start_hour" : {
				"type" : "integer"
			},
			"start_day" : {
				"type" : "integer"
			},
			"start_time_epoch" : {
				"type" : "long"
			},
			"created_at" : {
				"type" : "date"
			},
			"created_at_epoch" : {
				"type" : "long"
			},
			"direction" : {
				"type": "keyword",
				"index": true
			},
			"type" : {
				"type": "keyword",
				"index": true				
			},
			"call_duration" : {
				"type" : "short"
			},
			"record_duration" : {
				"type" : "short"
			},
			"is_monitored" : {
				"type": "keyword",
				"index": true
			},
			"call_number" : {
				"type": "keyword",
				"index": true
			},
			"final_action" : {
				"type": "keyword",
				"index": true
			},
			"voicemail_url" : {
				"type": "keyword",
				"index": false
			},
			"voicemail_cp_url" : {
				"type": "keyword",
				"index": false
			},
			"voicemail_transcript" : {
				"type": "keyword",
				"index": false
			},
			"call_recording_url" : {
				"type": "keyword",
				"index": false
			},
			"call_recording_cp_url" : {
				"type": "keyword",
				"index": false
			},
			"called_nickname" : {
				"type": "text",
				"index": true
			},
			"caller_cnam" : {
				"type": "text",
				"index": true
			},
			"extension": {
                "type" : "object",
                "properties": {
                    "id" : {
                        "type" : "long"
                    },
                    "name" : {
						"type": "text",
						"index": true
					},
                    "extension" : {
                        "type" : "integer"
                    },
                    "voip_id" : {
                        "type" : "integer"
                    }
                }
            },
            "details" : {
                "type": "nested",
                "properties" : {
                    "called_number" : {
						"type": "keyword",
						"index": true
					},
                    "type_called_number" : {
						"type": "keyword",
						"index": true
					},
                    "caller_id" : {
						"type": "text",
						"index": true
					},
                    "start_time" : {
                        "type" : "long"
                    },
                    "start_time_ms" : {
                        "type" : "date"
                    },
                    "type" : {
						"type": "keyword",
						"index": true
					},
					"duration" : {
						"type" : "short"
					},		
					"voip_id" : {
                        "type" : "integer"
                    }
                }
            }            
		}
	}
};