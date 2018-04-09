const crypto = require('crypto');
const assert = require('assert');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const HKDF = require('hkdf');
const chacha = require('chacha');

function _print(prefix, step, value) {
  console.log(prefix, step || '', Buffer.isBuffer(value) ? value.toString('hex') : value || '');
}

function generateKey(privKeyHex) {
  let curve;
  if (privKeyHex) {
    curve = ec.keyFromPrivate(privKeyHex);
  } else {
    curve = ec.genKeyPair();
  }
  return {
    priv: curve.getPrivate(),
    pub: curve.getPublic(),
    compressed() {
      let hex = curve.getPublic(true, 'hex');
      return Buffer.from(hex, 'hex');
    },
  };
}

function sha256(data) {
  let hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest();
}

function ecdh(rk, k) {
  let print = _print.bind(undefined, '    -->');

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

  print('ecdh.x:', shared.getX().toString(16));
  print('ecdh.y:', shared.getY().toString(16));
  print('ecdh.pub:', ec.keyFromPublic(shared).getPublic(true, 'hex'));

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

function decryptWithAD(k, n, ad, ciphertext) {
  const decipher = chacha.createDecipher(k, n);
  decipher.setAAD(ad);
  decipher.setAuthTag(ciphertext);
  return decipher.final();
}

async function connect() {
  let print = _print.bind(undefined, '-->');

  let rs = {
    pub: Buffer.from('028d7500dd4c12685d1f568b4c2b5048e8534b873319f3a8daa612b469132ec7f7', 'hex'),
    compressed() {
      return Buffer.from(
        '028d7500dd4c12685d1f568b4c2b5048e8534b873319f3a8daa612b469132ec7f7',
        'hex'
      );
    },
  };

  let ls = generateKey('1111111111111111111111111111111111111111111111111111111111111111');
  let e = generateKey('1212121212121212121212121212121212121212121212121212121212121212');

  print('rs.pub:', rs.pub);
  print('ls.priv:', ls.priv);
  print('ls.pub:', ls.compressed());
  print('e.priv', e.priv);
  print('e.pub', e.compressed());

  // initialization stage
  print = _print.bind(undefined, '--> init');
  console.log();
  print();

  let protocolName = 'Noise_XK_secp256k1_ChaChaPoly_SHA256';
  let prologue = 'lightning';

  let h = sha256(Buffer.from(protocolName));
  let ck = h;
  print('hash:', h);

  h = sha256(Buffer.concat([h, Buffer.from(prologue)]));
  print('hash:', h);

  h = sha256(Buffer.concat([h, rs.compressed()]));
  print('hash:', h);

  // act 1
  print = _print.bind(undefined, '--> act1');
  console.log();
  print();

  h = sha256(Buffer.concat([h, e.compressed()]));
  print('hash:', h);
  assert.equal(
    h.toString('hex'),
    '9e0e7de8bb75554f21db034633de04be41a2b8a18da7a319a03c803bf02b396c'
  );

  let ss = ecdh(rs.pub, e.priv);
  print('ss:', ss);
  assert.equal(
    ss.toString('hex'),
    '1e2fb3c8fe8fb9f262f649f64d26ecf0f2c0a805a767cf02dc2d77a6ef1fdcc3'
  );

  let temp_k1 = await hkdf(ck, ss);
  ck = temp_k1.slice(0, 32);
  temp_k1 = temp_k1.slice(32);
  print('ck:', ck);
  print('temp_k1:', temp_k1);
  assert.equal(
    ck.toString('hex'),
    'b61ec1191326fa240decc9564369dbb3ae2b34341d1e11ad64ed89f89180582f'
  );
  assert.equal(
    temp_k1.toString('hex'),
    'e68f69b7f096d7917245f5e5cf8ae1595febe4d4644333c99f9c4a1282031c9f'
  );

  let c = encryptWithAD(temp_k1, Buffer.alloc(12), h, '');
  print('c:', c);
  assert.equal(c.toString('hex'), '0df6086551151f58b8afe6c195782c6a');

  h = sha256(Buffer.concat([h, c]));
  print('h:', h);
  assert.equal(
    h.toString('hex'),
    '9d1ffbb639e7e20021d9259491dc7b160aab270fb1339ef135053f6f2cebe9ce'
  );

  let m = Buffer.concat([Buffer.alloc(1), e.compressed(), c]);
  print('m:', m);
  assert.equal(
    m.toString('hex'),
    '00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a'
  );

  // act 2
  print = _print.bind(undefined, '--> act2');
  console.log();
  print();

  // 1. read exactly 50 bytes from the netwrok buffer
  m = Buffer.from(
    '0002466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f276e2470b93aac583c9ef6eafca3f730ae',
    'hex'
  ).slice(0, 50);
  assert.equal(m.length, 50);

  // 2. parse th read message m into v,re, and c
  let v = m.slice(0, 1)[0];
  let re = m.slice(1, 34);
  c = m.slice(34);
  print('v:', v);
  print('re:', re);
  print('c:', c);
  assert.equal(
    re.toString('hex'),
    '02466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f27'
  );

  // 3. assert version is known version
  assert.equal(v, 0, 'Unrecognized version');

  // 4. sha256(h || re.serializedCompressed');
  h = sha256(Buffer.concat([h, re]));
  print('h:', h);
  assert.equal(
    h.toString('hex'),
    '38122f669819f906000621a14071802f93f2ef97df100097bcac3ae76c6dc0bf'
  );

  // 5. ss = ECDH(re, e.priv);
  ss = ecdh(re, e.priv);
  print('ss:', ss);
  assert.equal(
    ss.toString('hex'),
    'c06363d6cc549bcb7913dbb9ac1c33fc1158680c89e972000ecd06b36c472e47'
  );

  // 6. ck, temp_k2 = HKDF(cd, ss)
  let temp_k2 = await hkdf(ck, ss);
  ck = temp_k2.slice(0, 32);
  temp_k2 = temp_k2.slice(32);
  print('ck:', ck);
  print('temp_k2:', temp_k2);
  assert.equal(
    ck.toString('hex'),
    'e89d31033a1b6bf68c07d22e08ea4d7884646c4b60a9528598ccb4ee2c8f56ba'
  );
  assert.equal(
    temp_k2.toString('hex'),
    '908b166535c01a935cf1e130a5fe895ab4e6f3ef8855d87e9b7581c4ab663ddc'
  );

  // 7. p = decryptWithAD()
  decryptWithAD(temp_k2, Buffer.alloc(12), h, c);

  // 8. h = sha256(h || c)
  h = sha256(Buffer.concat([h, c]));
  print('h:', h);
  assert.equal(
    h.toString('hex'),
    '90578e247e98674e661013da3c5c1ca6a8c8f48c90b485c0dfa1494e23d56d72'
  );
}

connect().catch(console.error);
