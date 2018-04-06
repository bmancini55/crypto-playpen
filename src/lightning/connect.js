const crypto = require('crypto');
const assert = require('assert');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

function generateKey(privKeyHex) {
  let curve = crypto.createECDH('secp256k1');
  if (privKeyHex) {
    curve.setPrivateKey(privKeyHex, 'hex');
  } else {
    curve.generateKeys();
  }
  return {
    priv: curve.getPrivateKey(),
    pub: curve.getPublicKey(),
    serializeCompressed() {
      return curve.getPublicKey('hex', 'compressed');
    },
    curve,
  };
}

function ecdh(rk, k) {
  // looks like we can't use the built in ecdh code because we don't get the Y value
  // and can't generate the compressed key from that...
  //
  // let curve = crypto.createECDH('secp256k1');
  // curve.setPrivateKey(k);
  // let sharedSecret = curve.computeSecret(rk, 'hex');
  // console.log(sharedSecret);

  // so instead we'll use elliptic library
  let priv = ec.keyFromPrivate(k);
  let pub = ec.keyFromPublic(rk);

  // again, we can't use the "derive function"
  //
  // let result = priv.derive(pub.getPublic());
  // console.log(result);

  // instead we directly perform the multiply function
  // refer to:
  // https://github.com/indutny/elliptic/blob/master/lib/elliptic/ec/key.js#L104
  // https://github.com/lightningnetwork/lnd/blob/406fdbbf640e8cc964625386b0d44e2c64bc7a57/brontide/noise.go#L58
  //
  let shared = pub.getPublic().mul(priv.getPrivate());

  console.log('    --> ecdh.x:', shared.getX().toString(16));
  console.log('    --> ecdh.y:', shared.getY().toString(16));
  console.log('    --> ecdh.pub:', ec.keyFromPublic(shared).getPublic(true, 'hex'));

  // ooh look, the function to generate a derived key from x,y pairs
  // create a compressed DER encoded EC point...
  //
  // let format = 0x2;
  // if (res.getY().isOdd()) format |= 0x1;
  // format = Buffer.from([format]);
  // let boom = Buffer.concat([format, res.getX().toBuffer()]);

  // generate the compressed point
  shared = ec.keyFromPublic(shared).getPublic(true, 'hex');

  // sha256 the buffer
  return sha256(Buffer.from(shared, 'hex'));
}

function sha256(data) {
  let hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest();
}

let rs = {
  pub: Buffer.from('028d7500dd4c12685d1f568b4c2b5048e8534b873319f3a8daa612b469132ec7f7', 'hex'),
  serializeCompressed() {
    return '028d7500dd4c12685d1f568b4c2b5048e8534b873319f3a8daa612b469132ec7f7';
  },
};

let ls = generateKey('1111111111111111111111111111111111111111111111111111111111111111');
let e = generateKey('1212121212121212121212121212121212121212121212121212121212121212');

console.log('--> rs.pub:', rs.pub.toString('hex'));
console.log('--> ls.priv:', ls.priv.toString('hex'));
console.log('--> ls.pub:', ls.serializeCompressed());
console.log('--> e.priv', e.priv.toString('hex'));
console.log('--> e.pub', e.serializeCompressed());

// initialization stage
console.log('\n--> init');

let protocolName = 'Noise_XK_secp256k1_ChaChaPoly_SHA256';
let prologue = 'lightning';

let h = sha256(Buffer.from(protocolName));
let ck = h;
console.log('--> init hash:', h.toString('hex'));

h = sha256(Buffer.concat([h, Buffer.from(prologue)]));
console.log('--> init hash:', h.toString('hex'));

h = sha256(Buffer.concat([h, Buffer.from(rs.serializeCompressed(), 'hex')]));
console.log('--> init hash:', h.toString('hex'));

// act 1
console.log('\n--> act1');

h = sha256(Buffer.concat([h, Buffer.from(e.serializeCompressed(), 'hex')]));
console.log('--> act1 hash:', h.toString('hex'));
assert.equal(h.toString('hex'), '9e0e7de8bb75554f21db034633de04be41a2b8a18da7a319a03c803bf02b396c');

let ss = ecdh(rs.pub, e.priv);
console.log('--> act1 ss:', ss.toString('hex'));
assert.equal(
  ss.toString('hex'),
  '1e2fb3c8fe8fb9f262f649f64d26ecf0f2c0a805a767cf02dc2d77a6ef1fdcc3'
);
