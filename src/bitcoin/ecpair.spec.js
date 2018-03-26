// const { crypto, ECPair } = require('bitcoinjs-lib');
// const bigi = require('bigi');

// (function createRandomKey() {
//     let keyPair = ECPair.makeRandom();
//     console.log('random pair   ', keyPair.d.toString(), keyPair.compressed);
// })();

// (function createHashKey() {
//     let hash = crypto.sha256('this is a test of the sha256 hashing algorithm');
//     let d = bigi.fromBuffer(hash);
//     let keyPair = new ECPair(d);
//     console.log('hash pair     ', keyPair.d.toString(), keyPair.compressed);
// })();

// (function importWIFCompressedKey() {
//     let keyPair = ECPair.fromWIF('L4AvZYNLWfi3FW1gtNaf4Bc8epymz5RvncLYd5y1qd3n5EuSjNrF');
//     console.log('wif comp pair ', keyPair.d.toString(), keyPair.compressed);
// })();

// (function convertWIFCompressedKeyToWIF() {
//     let keyPair = ECPair.fromWIF('L4AvZYNLWfi3FW1gtNaf4Bc8epymz5RvncLYd5y1qd3n5EuSjNrF');
//     keyPair = new ECPair(keyPair.d, null, { compressed: false });
//     console.log('wif pair      ', keyPair.d.toString(), keyPair.compressed);
// })();

// (function importWIFKey() {
//     let keyPair = ECPair.fromWIF('5KPe4J5P6N1EeivAwgnEcACauXMZrBX7kQsCF4qwZmRC7rvZNz4');
//     console.log('wif pair      ', keyPair.d.toString(), keyPair.compressed);
// })();

// (function exportPublicKey() {
//     let keyPair = ECPair.makeRandom();
//     console.log('public key    ', keyPair.getPublicKeyBuffer().toString('hex'));
// })();

// (function importPublicKeyFromHex() {
//     let buffer = Buffer.from(
//         '035e5c917ef92bfa938a7e19b36b853d1675249c65a7d8922713eaa920f717e2a1',
//         'hex'
//     );
//     let keyPair = ECPair.fromPublicKeyBuffer(buffer);
//     console.log('public key    ', keyPair.getPublicKeyBuffer().toString('hex'));
// })();
