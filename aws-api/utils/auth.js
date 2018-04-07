var sha256;
var AES;
var Utf8;
const portalDomain = 'region1.purpleportal.net';

//'X-API-Authorization'
module.exports.getAuthInfo = (publicKey, privateKey, path, now, postString) => {
	sha256 = sha256 || require('js-sha256');
    postString = postString || '';
	var nowString = now.toUTCString(),
		hashString = 'application/json\n'+
		portalDomain+'\n'+
		path+'\n'+
		nowString + '\n'+
		postString +'\n';
	//console.log('\n'+hashString);
	var hash = sha256.hmac(privateKey, hashString);
	var header = publicKey+':'+hash;
	return {header:header, hashString: hashString, portalDomain:portalDomain, now:now};
};
  
module.exports.encryptObject = (obj) => {
	let clone = Object.assign({}, obj); 
	let sharedKey = process.env.SHARED_KEY;
	AES = AES || require("crypto-js/aes");
	clone.timestamp = clone.timestamp || new Date().getTime();        
	let json = JSON.stringify(clone, null, 2);
	// Encrypt
	let ciphertext = AES.encrypt(json,sharedKey);
	return ciphertext;
};

module.exports.decryptObject = (ciphertext) => {
	let sharedKey = process.env.SHARED_KEY;
	AES = AES || require("crypto-js/aes");
	Utf8 = Utf8 || require("crypto-js/enc-utf8");
	let bytes  = AES.decrypt(ciphertext.toString(), sharedKey);
	let plaintext = bytes.toString(Utf8);
	return JSON.parse(plaintext);
};