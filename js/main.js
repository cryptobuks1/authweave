var arweave = Arweave.init({host: 'arweave.net', port: 443, protocol: 'https'});
var address;
var wallet;
var ttimer;

const appName = 'authweave';
const appVersion = '1.0.0';
const { authenticator } = window.otplib;

async function updateTabs(){
	const txs = await getTransactionsFromApp(appName, address);
	if (txs.length > 0){
		$('a#generatecode-tab').removeClass('disabled');
	}
}

async function generateTable(){
	$('.keyTable').html('');
	const txs = await getTransactionsFromApp(appName, address);
	if (txs.length > 0){
		$('.loading').show();
		await asyncForEach(txs, async (x) => {
			const status = await arweave.transactions.getStatus(x);
			if (status.status == 200){
				const data = await arweave.transactions.getData(x, {decode: true, string: true});
				const jsonData = JSON.parse(data)
				const decryptedData = decryptData(jsonData, wallet.dp).split('#-!!###!!-#');
				const nameKey = decryptedData[0];
				const secretKey = decryptedData[1];
				$('.keyTable').append('<div class="row mt-1"><div class="col-8 text-left lbl">' + nameKey + '</div><div class="col"><button name="button" data-nkx="' + nameKey + '" data-skx="' + secretKey + '" class="btn btn-outline-secondary btn-sm generatebtn">Generate</button></div></div>');
			}
		});
		$('.loading').hide();
	} else {
		$('.keyTable').html('Nothing to see here.');
	}
}

async function process_login(){
	$('.not-logged-in').hide();
	$('.logged-in').show();	
	updateTabs();
}
  
async function login (files){
    var fr = new FileReader();
    fr.onload = async function (ev){
        try {
            wallet = JSON.parse(ev.target.result);
			
            address = await arweave.wallets.jwkToAddress(wallet);
			await process_login();
        } catch (err) {
            alert('Error logging in: ' + err);
        }
    }
    fr.readAsText(files[0]);
}

$('.keyTable').on('click', '.generatebtn', function () {
	const nkx = $(this).data("nkx");
	const skx = $(this).data("skx");
	$('.tfa-name').text(nkx);
	$('.modal-body').text(skx);
	
	if (ttimer !== undefined){
		clearInterval(ttimer);
	}
	
	$('.tfa-code').text(authenticator.generate(skx))
	$('#tfa-timer').text(authenticator.timeRemaining());
	
	ttimer = setInterval(function(){
		$('#tfa-timer').text(authenticator.timeRemaining());
		if (authenticator.timeRemaining() == 30){
			$('.tfa-code').text(authenticator.generate(skx))
		}
	}, 1000);
	
	$('.tfa-display').show();
})

var $saveform = $('#saveForm').on('submit', async function () {
	$('#button-n').hide();
	$('#button-l').show();
	
	const nameKey = $('.n-add-key').val();
	const secretKey = $('.s-add-key').val();
	const nsKey = ''.concat(nameKey, '#-!!###!!-#', secretKey);
	const encryptedData = encryptData(nsKey, wallet.dp);
	const jsonData = JSON.stringify(encryptedData);
    var tx = await arweave.createTransaction({data: jsonData,}, wallet);
    tx.addTag('App-Name', appName);
    tx.addTag('App-Version', appVersion);
    await arweave.transactions.sign(tx, wallet);
    await arweave.transactions.post(tx);
	console.log('txid:', tx.id);
    alert('Your 2FA key has been saved!\nJust wait till the tx gets confirmed and log in again to see it.');
	
	$('.n-add-key').val('');
	$('.s-add-key').val('');
	$('#button-l').hide();
	$('#button-n').show();
});

$('a[data-toggle="tab"]').on('show.bs.tab', function (e) {
  if (e.target.hash=='#add-key') {
	$('.tfa-display').hide();
  } else if (e.target.hash=='#generate-code') {
	generateTable();
  }
})

$(document).ready(function () {
	$('[data-toggle="tooltip"]').tooltip();
})