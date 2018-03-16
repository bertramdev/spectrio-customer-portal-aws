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
	age18Birth: moment(now).add(-18, 'years'), 
	age35Birth: moment(now).add(-35, 'years'),
	age50Birth: moment(now).add(-50, 'years'),
	age70Birth: moment(now).add(-70, 'years')

};