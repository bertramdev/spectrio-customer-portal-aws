module.exports.getCallbackBody = function(success, statusCode, message, data) {
	return {
		statusCode: statusCode,
		headers: {
			"Access-Control-Allow-Origin" : "*", // Required for CORS support to work
			"Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
		},
		body: JSON.stringify({
			success: success,
			statusCode:statusCode, 
			message: message,
			data: (data||null)
		})
	};
}