const crypto = require('crypto');
const assert = require('assert');

// refer to test vectors in
// https://github.com/lightningnetwork/lightning-rfc/blob/master/08-transport.md#initiator-tests
let privKeyHex = '1111111111111111111111111111111111111111111111111111111111111111';
let pubKeyHex = '034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa';

let curve = crypto.createECDH('secp256k1');
curve.setPrivateKey(Buffer.from(privKeyHex, 'hex'));
let priv = curve.getPrivateKey('hex');
let pub = curve.getPublicKey('hex', 'compressed');

console.log('--> private key:', priv);
console.log('--> public key compressed (DER encoded):', pub);

assert(priv === privKeyHex, 'Private key did not match');
assert(pub === pubKeyHex, 'Public key did not match');
