// credits to https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function getTransactionsFromApp(app, address){
    const transactions = await arweave.arql({
		op: 'and',
		expr1:
			{
				op: 'equals',
				expr1: 'App-Name',
				expr2: app
			},
		expr2:
			{
				op: 'equals',
				expr1: 'from',
				expr2: address,
			},
	});
	return transactions;
}

function objectToBase64(obj){
	const q = CryptoJS.enc.Utf8.parse(JSON.stringify(obj));
	const p = CryptoJS.enc.Base64.stringify(q);
	return p;
}

function base64ToObject(b64){
	const q = CryptoJS.enc.Base64.parse(b64);
	const p = JSON.parse(q.toString(CryptoJS.enc.Utf8));
	return p;
}

function encryptData(data, key){
	const salt = CryptoJS.lib.WordArray.random(16);
	const iv = CryptoJS.lib.WordArray.random(16);
	const pbkdf2key = CryptoJS.PBKDF2(key, salt, { keySize: 512/32, iterations: 2000 });
	const encrypted = CryptoJS.AES.encrypt(data, pbkdf2key, { iv: iv }).ciphertext.toString(CryptoJS.enc.Base64);

	return { st: objectToBase64(salt), iv: objectToBase64(iv), ct: encrypted };
}

function decryptData(data, key){
	const salt = base64ToObject(data.st);
	const iv = base64ToObject(data.iv);
	const ct = data.ct;
	const pbkdf2key = CryptoJS.PBKDF2(key, salt, { keySize: 512/32, iterations: 2000 });
	
	return CryptoJS.AES.decrypt(ct, pbkdf2key, { iv: iv }).toString(CryptoJS.enc.Utf8);
}