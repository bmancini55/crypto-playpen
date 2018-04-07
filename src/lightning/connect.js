const crypto = require('crypto');
const assert = require('assert');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const HKDF = require('hkdf');
const chacha = require('chacha');

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

function sha256(data) {
  let hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest();
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

function hkdf(salt, ikm) {
  return new Promise(resolve => {
    let runner = new HKDF('sha256', salt, ikm);
    runner.derive('', 64, resolve);
  });
}

function encryptWithAD(k, n, ad, plaintext) {
  const cipher = chacha.createCipher(k, n);
  cipher.setAAD(ad);
  cipher.update(plaintext);
  cipher.final();
  return cipher.getAuthTag();
}

async function connect() {
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
  assert.equal(
    h.toString('hex'),
    '9e0e7de8bb75554f21db034633de04be41a2b8a18da7a319a03c803bf02b396c'
  );

  let ss = ecdh(rs.pub, e.priv);
  console.log('--> act1 ss:', ss.toString('hex'));
  assert.equal(
    ss.toString('hex'),
    '1e2fb3c8fe8fb9f262f649f64d26ecf0f2c0a805a767cf02dc2d77a6ef1fdcc3'
  );

  let temp_k1 = await hkdf(ck, ss);
  ck = temp_k1.slice(0, 32);
  temp_k1 = temp_k1.slice(32);
  console.log('--> act1 ck:', ck.toString('hex'));
  console.log('--> act1 temp_k1:', temp_k1.toString('hex'));
  assert.equal(
    ck.toString('hex'),
    'b61ec1191326fa240decc9564369dbb3ae2b34341d1e11ad64ed89f89180582f'
  );
  assert.equal(
    temp_k1.toString('hex'),
    'e68f69b7f096d7917245f5e5cf8ae1595febe4d4644333c99f9c4a1282031c9f'
  );

  let c = encryptWithAD(temp_k1, Buffer.alloc(12), h, '');
  console.log('--> act1 c:', c.toString('hex'));
  assert.equal(c.toString('hex'), '0df6086551151f58b8afe6c195782c6a');

  h = sha256(Buffer.concat([h, c]));
  console.log('--> act1 h:', h.toString('hex'));
  assert.equal(
    h.toString('hex'),
    '9d1ffbb639e7e20021d9259491dc7b160aab270fb1339ef135053f6f2cebe9ce'
  );

  let m = Buffer.concat([Buffer.alloc(1), Buffer.from(e.serializeCompressed(), 'hex'), c]);
  console.log('--> act1 m:', m.toString('hex'));
  assert.equal(
    m.toString('hex'),
    '00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a'
  );
}

connect().catch(console.error);
