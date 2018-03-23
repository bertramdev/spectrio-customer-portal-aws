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