const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const es = Buffer.from('1212121212121212121212121212121212121212121212121212121212121212', 'hex');
const rpk = Buffer.from(
  '028d7500dd4c12685d1f568b4c2b5048e8534b873319f3a8daa612b469132ec7f7',
  'hex'
);

const esKey = ec.keyFromPrivate(es);
const rpkPoint = ec.keyFromPublic(rpk);

const point = rpkPoint.getPublic().mul(esKey.getPrivate());
console.log(point);

console.log(Buffer.from(point.encode(null, true)));
console.log(
  Buffer.from(
    ec
      .hash()
      .update(point.encode(null, true))
      .digest()
  )
);

const ecdh = crypto.createECDH('secp256k1');
ecdh.setPrivateKey(es);
console.log(ecdh.computeSecret(rpk));
console.log(
  crypto.ECDH.convertKey(
    Buffer.concat([Buffer.from('02', 'hex'), ecdh.computeSecret(rpk)]),
    'secp256k1',
    undefined,
    undefined,
    'uncompressed'
  )
);

const h = crypto.createHash('sha256');
h.update(Buffer.from('02f72f179ece29f94db245b48447e9416482a6b7ce2beda30698ca56562a3b1e71', 'hex'));
const r = h.digest();
console.log(r);
