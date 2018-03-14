const sha256 = require('js-sha256');

const portalDomain = 'region1.purpleportal.net';

//'X-API-Authorization'
module.exports.getAuthInfo = (publicKey, privateKey, path, now, postString) => {
    postString = postString || '';
	var nowString = now.toUTCString(),
		hashString = 'application/json\n'+
		portalDomain+'\n'+
		path+'\n'+
		nowString + '\n'+
		postString +'\n';
	console.log('\n'+hashString);
	var hash = sha256.hmac(privateKey, hashString);
	var header = publicKey+':'+hash;
	return {header:header, hashString: hashString, portalDomain:portalDomain, now:now};
};
  
