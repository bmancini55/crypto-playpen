// example of sending and signing transactions with p2wpkh
let crypto = require('crypto');
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
let pair2 = bitcoin.ECPair.fromPrivateKey(pk2, { network: bitcoin.networks.testneset });
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
// bitcoin-cli -testnet -rpcuser=kek -rpcpassword=kek sendrawtransaction "02000000010203e67a047bc0843d8612208455d856765ab66fc28393eee4467a480bdcd633000000006b483045022100b9d9b1ce0983142f079ec0467272514eea1394633f11f60e0287d835b4bc1b0c022004db3327f01f72991988a4a87a9fce0994b1c90e979a42fed42c4420cc148bcc012102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934fffffffff0228230000000000001976a9147dc70ca254627bebcb54c839984d32dad9092edf88acc82aa800000000001976a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac00000000"
// txid: 515ecb42cacefd5872c4cb5ee124702785137406f85195ba72d2a81bbfa70561

// bitcoin-cli -testnet -rpcuser=kek -rpcpassword=kek getrawtransaction 7fa39332dcbc26fff7c8f10c8af97693a5c95cd92805afff9d8d60c636e80272 1
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

// bitcoin-cli -testnet -rpcuser=kek -rpcpassword=kek sendrawtransaction "02000000016105a7bf1ba8d272ba9551f806741385277024e15ecbc47258fdceca42cb5e51010000006a47304402204ea84c567f2043b6bf677e60ba7f7f13d14b82c9367a5562038b5effd9db7fa602202093b23d7a9e0c0ce7668e75f7c5c674ba34555d9a7e38e94245b422a125d6a8012102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934fffffffff02282300000000000017a9140714c97d999d7e3f1c68b015fec735b857e9064987b803a800000000001976a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac00000000"
// txid: cf8597868cec794f9995fad1fb1066f06433332bc56c399c189460e74b7c9dfe

// bitcoin-cli -testnet -rpcuser=kek -rpcpassword=kek decoderawtransaction "02000000016105a7bf1ba8d272ba9551f806741385277024e15ecbc47258fdceca42cb5e51010000006a47304402204ea84c567f2043b6bf677e60ba7f7f13d14b82c9367a5562038b5effd9db7fa602202093b23d7a9e0c0ce7668e75f7c5c674ba34555d9a7e38e94245b422a125d6a8012102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934fffffffff02282300000000000017a9140714c97d999d7e3f1c68b015fec735b857e9064987b803a800000000001976a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac00000000"
// {
//   "txid": "cf8597868cec794f9995fad1fb1066f06433332bc56c399c189460e74b7c9dfe",
//   "hash": "cf8597868cec794f9995fad1fb1066f06433332bc56c399c189460e74b7c9dfe",
//   "version": 2,
//   "size": 223,
//   "vsize": 223,
//   "weight": 892,
//   "locktime": 0,
//   "vin": [
//     {
//       "txid": "515ecb42cacefd5872c4cb5ee124702785137406f85195ba72d2a81bbfa70561",
//       "vout": 1,
//       "scriptSig": {
//         "asm": "304402204ea84c567f2043b6bf677e60ba7f7f13d14b82c9367a5562038b5effd9db7fa602202093b23d7a9e0c0ce7668e75f7c5c674ba34555d9a7e38e94245b422a125d6a8[ALL] 02e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934f",
//         "hex": "47304402204ea84c567f2043b6bf677e60ba7f7f13d14b82c9367a5562038b5effd9db7fa602202093b23d7a9e0c0ce7668e75f7c5c674ba34555d9a7e38e94245b422a125d6a8012102e577d441d501cace792c02bfe2cc15e59672199e2195770a61fd3288fc9f934f"
//       },
//       "sequence": 4294967295
//     }
//   ],
//   "vout": [
//     {
//       "value": 0.00009000,
//       "n": 0,
//       "scriptPubKey": {
//         "asm": "OP_HASH160 0714c97d999d7e3f1c68b015fec735b857e90649 OP_EQUAL",
//         "hex": "a9140714c97d999d7e3f1c68b015fec735b857e9064987",
//         "reqSigs": 1,
//         "type": "scripthash",
//         "addresses": [
//           "2MstfcwMMM1BtfkQJdzKHgZVuQ2cDpBfAaq"
//         ]
//       }
//     },
//     {
//       "value": 0.11011000,
//       "n": 1,
//       "scriptPubKey": {
//         "asm": "OP_DUP OP_HASH160 c34015187941b20ecda9378bb3cade86e80d2bfe OP_EQUALVERIFY OP_CHECKSIG",
//         "hex": "76a914c34015187941b20ecda9378bb3cade86e80d2bfe88ac",
//         "reqSigs": 1,
//         "type": "pubkeyhash",
//         "addresses": [
//           "myKLpz45CSfJzWbcXtammgHmNRZsnk2ocv"
//         ]
//       }
//     }
//   ]
// }

function sendPayment4() {
  let txid = 'cf8597868cec794f9995fad1fb1066f06433332bc56c399c189460e74b7c9dfe';
  let vout = 0;
  let txvalue = 9000;

  let send = 8000;
  let fee = 1000;

  let script = bitcoin.script.compile([
    Buffer.from('pax_is_awesome!'),
    OPS.OP_SHA256,
    Buffer.from('253c853e2915f5979e3c6b248b028cc5e3b4e7be3d0884db6c3632fd85702def', 'hex'),
    OPS.OP_EQUAL,
  ]);

  let { output: prevOutScript } = bitcoin.payments.p2sh({
    redeem: { output: script, network: bitcoin.networks.testnet },
    network: bitcoin.networks.testnet,
  });

  let txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  txb.addInput(txid, vout, null, prevOutScript);

  txb.addOutput('myKLpz45CSfJzWbcXtammgHmNRZsnk2ocv', send);

  let redeemScript = bitcoin.script.compile([
    Buffer.from('pax_is_awesome!'),
    OPS.OP_SHA256,
    Buffer.from('253c853e2915f5979e3c6b248b028cc5e3b4e7be3d0884db6c3632fd85702def', 'hex'),
    OPS.OP_EQUAL,
  ]);

  console.log(redeemScript);

  txb.sign(0, pair1, redeemScript);

  let tx = txb.build();
  console.log(tx.toHex());
}

// sendPayment4();

function sendPayment5() {
  let { output } = bitcoin.payments.p2pkh({
    pubkey: pair1.publicKey,
    network: bitcoin.networks.testnet,
  });

  let txid = 'cf8597868cec794f9995fad1fb1066f06433332bc56c399c189460e74b7c9dfe';
  let vout = 1;
  let txvalue = 11011000;

  let send = 900;
  let fee = 100;

  let txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
  txb.addInput(txid, vout, null, output);
  txb.addOutput('mrz1DDxeqypyabBs8N9y3Hybe2LEz2cYBu', send);
  txb.addOutput('myKLpz45CSfJzWbcXtammgHmNRZsnk2ocv', txvalue - send - fee);
  txb.sign(0, pair1);

  let tx = txb.build();
  console.log(tx.toHex());
}

sendPayment5();
