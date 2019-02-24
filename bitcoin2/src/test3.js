// example of sending and signing transactions with p2wpkh
let bitcoin = require('bitcoinjs-lib');
const OPS = require('bitcoin-ops');

// need to convert the private key bytes into an ECPair object

// non-segwit
// address myKLpz45CSfJzWbcXtammgHmNRZsnk2ocv
let pk1 = Buffer.from('60226ca8fb12f6c8096011f36c5028f8b7850b63d495bc45ec3ca478a29b473d', 'hex');
let pair1 = bitcoin.ECPair.fromPrivateKey(pk1, { network: bitcoin.networks.testnet });
let payment1 = bitcoin.payments.p2pkh({
  pubkey: pair1.publicKey,
  network: bitcoin.networks.testnet,
});
console.log(payment1.address);

// non-segwit
// address mrz1DDxeqypyabBs8N9y3Hybe2LEz2cYBu
let pk2 = Buffer.from('eb2250715758f2d0b2a3ebe829f88399212cfa692ee8d7fc3bdb3a550c46e2b4', 'hex');
let pair2 = bitcoin.ECPair.fromPrivateKey(pk2, { network: bitcoin.networks.testnet });
let { address: address2 } = bitcoin.payments.p2pkh({
  pubkey: pair2.publicKey,
  network: bitcoin.networks.testnet,
});
console.log(address2);

// segwit
// address tb1qeakm4zty44k7t63jcjzcjkaj6rylma92m6mtt9
let pk3 = Buffer.from('bccb30842073b011b3463c0a52ec30bdadbf5b5c289c6d5f37af4e3528de73ff', 'hex');
let pair3 = bitcoin.ECPair.fromPrivateKey(pk3, { network: bitcoin.networks.testnet });
let payment3 = bitcoin.payments.p2wpkh({
  pubkey: pair3.publicKey,
  network: bitcoin.networks.testnet,
});
console.log(payment3.address);

// send from segwit to non-segwit
function sendPayment1() {
  let { output } = bitcoin.payments.p2wpkh({
    pubkey: pair3.publicKey,
    network: bitcoin.networks.testnet,
  });

  let txid = '7fa39332dcbc26fff7c8f10c8af97693a5c95cd92805afff9d8d60c636e80272';
  let voutidx = 0;
  let txvalue = 11031494;

  let txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  txb.addInput(txid, voutidx, null, output); // provide the prev out script
  txb.addOutput('myKLpz45CSfJzWbcXtammgHmNRZsnk2ocv', 11031000);
  txb.sign(0, pair3, null, null, txvalue);

  let tx = txb.build();
  console.log(tx.toHex());
}

// sendPayment1();
// txid: 33d6dc0b487a46e4ee9383c26fb65a7656d855842012863d84c07b047ae60302

function sendPayment2() {
  let { output } = bitcoin.payments.p2pkh({
    pubkey: pair1.publicKey,
    network: bitcoin.networks.testnet,
  });

  let txid = '33d6dc0b487a46e4ee9383c26fb65a7656d855842012863d84c07b047ae60302';
  let vout = 0;
  let txvalue = 11031000;

  let send = 9000;
  let fee = 1000;

  let txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  txb.addInput(txid, vout, null, output);
  txb.addOutput('mrz1DDxeqypyabBs8N9y3Hybe2LEz2cYBu', send);
  txb.addOutput('myKLpz45CSfJzWbcXtammgHmNRZsnk2ocv', txvalue - send - fee);
  txb.sign(0, pair1);

  let tx = txb.build();
  console.log(tx.toHex());
}

// sendPayment2();
// bitcoin-cli -testnet sendrawtransaction "02000000010203e67a047bc0843d8612208455d856765ab66fc28393eee4467a480bdcd633000000006b483045022100b9d9b1ce0983142f079ec0467272514eea1394633f11f60e0287d835b4bc1b0c022004db3327f01f72991988a4a87a9fce0994b1c90e979a42fed42c4420cc148bcc012102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934fffffffff0228230000000000001976a9147dc70ca254627bebcb54c839984d32dad9092edf88acc82aa800000000001976a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac00000000"
// txid: 515ecb42cacefd5872c4cb5ee124702785137406f85195ba72d2a81bbfa70561

// bitcoin-cli -testnet getrawtransaction 7fa39332dcbc26fff7c8f10c8af97693a5c95cd92805afff9d8d60c636e80272 1
// 02000000000101b3878839d4f2b3d755011be03a9e0c82d98c00fe15e48c1c36de1d7646eda6bc0000000017160014f384952b6a1bc5eb6f6a6b5756d3d8e227944e11feffffff02c653a80000000000160014cf6dba8964ad6de5ea32c485895bb2d0c9fdf4aa564ca29e0a0000001600148afeedf2d7737a59f15a1a41924e70b458d43846024730440220304dc39de2bb883118e172dae9afaf4c34415c7a4235c0383c5b9763bfcf076c02202560a353e26ea3e224c028953b7471bfbbca5ca4033596fc3938df9631550a960121021a41e995ea0d787ee3a9d4aee432df59df4efa68edf4478f418b64c807b30901eb3c1600

function sendPayment3() {
  let { output } = bitcoin.payments.p2pkh({
    pubkey: pair1.publicKey,
    network: bitcoin.networks.testnet,
  });

  let txid = '515ecb42cacefd5872c4cb5ee124702785137406f85195ba72d2a81bbfa70561 ';
  let vout = 1;
  let txvalue = 11021000;

  let send = 9000;
  let fee = 1000;

  let txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  txb.addInput(txid, vout, null, output);

  let script = bitcoin.script.compile([
    OPS.OP_SHA256,
    Buffer.from('253c853e2915f5979e3c6b248b028cc5e3b4e7be3d0884db6c3632fd85702def', 'hex'),
    OPS.OP_EQUAL,
  ]);

  let { address } = bitcoin.payments.p2sh({
    redeem: { output: script, network: bitcoin.networks.testnet },
    network: bitcoin.networks.testnet,
  });

  txb.addOutput(address, send);
  txb.addOutput('myKLpz45CSfJzWbcXtammgHmNRZsnk2ocv', txvalue - send - fee);
  txb.sign(0, pair1);

  let tx = txb.build();
  console.log(tx.toHex());
}

// sendPayment3();

// bitcoin-cli -testnet sendrawtransaction "02000000016105a7bf1ba8d272ba9551f806741385277024e15ecbc47258fdceca42cb5e51010000006a47304402204ea84c567f2043b6bf677e60ba7f7f13d14b82c9367a5562038b5effd9db7fa602202093b23d7a9e0c0ce7668e75f7c5c674ba34555d9a7e38e94245b422a125d6a8012102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934fffffffff02282300000000000017a9140714c97d999d7e3f1c68b015fec735b857e9064987b803a800000000001976a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac00000000"
// txid: cf8597868cec794f9995fad1fb1066f06433332bc56c399c189460e74b7c9dfe

function sendPayment4() {
  let txid = 'b20a04213f72b626b8c488c01693af5f9c8b6241f1a9dca50264b3510fcb4e2a ';
  let vout = 1;
  let send = 9000;
  let change = 1099000 - send - 1000;

  let { output: prevScriptOut } = bitcoin.payments.p2pkh({
    pubkey: pair1.publicKey,
    network: bitcoin.networks.testnet,
  });

  let txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  txb.addInput(txid, vout, null, prevScriptOut); // standard p2pkh script

  // p2ph(p2pkh)
  let p2pkh = bitcoin.payments.p2pkh({
    address: 'mrz1DDxeqypyabBs8N9y3Hybe2LEz2cYBu',
    network: bitcoin.networks.testnet,
  });
  let p2sh = bitcoin.payments.p2sh({
    redeem: p2pkh,
    network: bitcoin.networks.testnet,
  });
  txb.addOutput(p2sh.output, send);

  // standard p2pkh change
  txb.addOutput('myKLpz45CSfJzWbcXtammgHmNRZsnk2ocv', change);

  // sign
  txb.sign(0, pair1);
  let tx = txb.build();
  console.log(tx.toHex());
}

// sendPayment4();

// bitcoin-cli -testnet sendrawtransaction 02000000012a4ecb0f51b36402a5dca9f141628b9c5faf9316c088c4b826b6723f21040ab2010000006b483045022100b32b1faca26acb15b317935ae0e322adae9240ed3e5ee298da9a6c2c72ca67b1022010afc784f6e531d5b0c22c1b485f3f378e3ec68d67373f4874320f1e42782ff0012102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934fffffffff02282300000000000017a914b0c48738b03497c8e000986046c280e621db077187e89d1000000000001976a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac00000000
// e975292df223bc5aded3b40a36430e153506c0a1e03aac7bb86c432244e2048f

function sendPayment5() {
  let txid = 'e975292df223bc5aded3b40a36430e153506c0a1e03aac7bb86c432244e2048f';
  let vout = 0;
  let send = 8000;

  let p2pkh = bitcoin.payments.p2pkh({
    pubkey: pair2.publicKey,
    network: bitcoin.networks.testnet,
  });

  let p2sh = bitcoin.payments.p2sh({
    redeem: p2pkh,
    network: bitcoin.networks.testnet,
  });

  let txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  txb.addInput(txid, vout, null, p2sh.output); // standard p2pkh script

  txb.addOutput('myKLpz45CSfJzWbcXtammgHmNRZsnk2ocv', send);
  txb.sign(0, pair1, p2pkh.output);
  let tx = txb.build();
  console.log('\nspend p2sh(p2pkh)\n' + tx.toHex());
}

// sendPayment5();

function sendPayment6() {
  let txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);

  // add p2pkh input
  txb.addInput(
    '0c17529882c7f63e7b9f12a5d227f00bfcf40e68fd45ff22d031734fadcf6b2d', // txid
    0, // vout
    null, // sequence
    bitcoin.payments.p2pkh({
      address: 'myKLpz45CSfJzWbcXtammgHmNRZsnk2ocv',
      network: bitcoin.networks.testnet,
    }).output // prevOutScript = p2pkhScript
  );

  // add p2sh(p2ms) output
  let p2ms = bitcoin.payments.p2ms({
    m: 2,
    pubkeys: [
      pair1.publicKey, // myKLpz45CSfJzWbcXtammgHmNRZsnk2ocv
      pair2.publicKey, // mrz1DDxeqypyabBs8N9y3Hybe2LEz2cYBu
    ],
    network: bitcoin.networks.testnet,
  });

  let p2sh = bitcoin.payments.p2sh({
    redeem: p2ms,
    network: bitcoin.networks.testnet,
  });
  txb.addOutput(p2sh.address, 7000); // 1000 fees

  // sign
  txb.sign(0, pair1);

  // output
  let tx = txb.build();
  console.log('\nsend p2sh(p2ms())\n' + tx.toHex());
}

sendPayment6();

// bitcoin-cli -testnet sendrawtransaction 02000000012d6bcfad4f7331d022ff45fd680ef4fc0bf027d2a5129f7b3ef6c7829852170c000000006a473044022079dda6cab377bf443865982c59ee990202a4e29689b41d83ccb46a74b34a782f0220150ed5fcd97b1dcc22b43accae80bdf7c38858b863003dc755bf2d88b8095142012102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934fffffffff01581b00000000000017a91451a92be9c57d4b865e69daad982c5ab6c1d7bea18700000000
// txid = 430a9edf9fab4a32e1923c9b0f1327f2431dc41a12d6c123e3a5749a26daedb4

function sendPayment7() {
  let txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);

  // add p2sh(p2ms) input
  txb.addInput(
    '430a9edf9fab4a32e1923c9b0f1327f2431dc41a12d6c123e3a5749a26daedb4', // txid
    0 // vout
  );

  // add p2sh(p2ms) output
  txb.addOutput('myKLpz45CSfJzWbcXtammgHmNRZsnk2ocv', 6000); // 1000 fees

  // sign
  let p2ms = bitcoin.payments.p2ms({
    m: 2,
    pubkeys: [
      pair1.publicKey, // myKLpz45CSfJzWbcXtammgHmNRZsnk2ocv
      pair2.publicKey, // mrz1DDxeqypyabBs8N9y3Hybe2LEz2cYBu
    ],
    network: bitcoin.networks.testnet,
  });

  let p2sh = bitcoin.payments.p2sh({
    redeem: p2ms,
    network: bitcoin.networks.testnet,
  });

  txb.sign(0, pair1, p2sh.redeem.output);
  txb.sign(0, pair2, p2sh.redeem.output);

  // output
  let tx = txb.build();
  console.log('\nspend p2sh(p2ms())\n' + tx.toHex());
}

sendPayment7();

// bitcoin-cli -testnet sendrawtransaction 0200000001b4edda269a74a5e323c1d6121ac41d43f227130f9b3c92e1324aab9fdf9e0a4300000000da00483045022100e66f9d2060149eab9b41ee29d33d83b86523825b301776383cf8275103e1e0b802206dfe8e94a0ba39890c461d21bf71c12b55a8e7a3e704bbc3e7ac208a400202bf0147304402201efdb55129b316a3fe60d8d4121cb8c8b88470c2829a5cc43c1a40a2195fbea20220527c7d227332ffc8b525acb303b43f769a86f06fadf51a54823337803c1e3cb80147522102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934f2102c65e30c3ff38e79e3eb73cebe9c4747007b6eef4ee40a01fc53b991dfaf1838752aeffffffff0170170000000000001976a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac00000000
// txid = 6786d6422f0fdf722b5f764294412bda7d0754533c74978e741f73659715aeb0
