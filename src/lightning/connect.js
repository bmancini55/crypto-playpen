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

async function hkdf(salt, ikm) {
  return new Promise(resolve => {
    let runner = new HKDF('sha256', salt, ikm);
    runner.derive('', 64, resolve);
  });
}

function encryptWithAD(k, n, ad, plaintext, debug) {
  let print = _print.bind(undefined, '    -->');

  const cipher = chacha.createCipher(k, n);
  cipher.setAAD(ad);
  let pad = cipher.update(plaintext);
  if (debug) print('chacha20:', pad);

  cipher.final();
  let tag = cipher.getAuthTag();
  if (debug) print('poly1305:', tag);

  return Buffer.concat([pad, tag]);
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

  // ACT 1
  //
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

  let t = encryptWithAD(temp_k1, Buffer.alloc(12), h, '');
  print('t:', t);
  assert.equal(t.toString('hex'), '0df6086551151f58b8afe6c195782c6a');

  h = sha256(Buffer.concat([h, t]));
  print('h:', h);
  assert.equal(
    h.toString('hex'),
    '9d1ffbb639e7e20021d9259491dc7b160aab270fb1339ef135053f6f2cebe9ce'
  );

  let m = Buffer.concat([Buffer.alloc(1), e.compressed(), t]);
  print('m:', m);
  assert.equal(
    m.toString('hex'),
    '00036360e856310ce5d294e8be33fc807077dc56ac80d95d9cd4ddbd21325eff73f70df6086551151f58b8afe6c195782c6a'
  );

  // ACT 2
  //
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
  let c = m.slice(34);
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

  // ACT 3
  //
  print = _print.bind(undefined, '--> act3');
  console.log();
  print();

  // 1. encrypt with chacha
  c = encryptWithAD(temp_k2, Buffer.from([0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]), h, ls.compressed());
  print('c:', c);
  assert.equal(
    c.toString('hex'),
    'b9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c3822'
  );

  // 2. h = sha256(h || c)
  h = sha256(Buffer.concat([h, c]));
  print('h:', h);
  assert.equal(
    h.toString('hex'),
    '5dcb5ea9b4ccc755e0e3456af3990641276e1d5dc9afd82f974d90a47c918660'
  );

  // 3. ss = ECDH(re, s.priv)
  ss = ecdh(re, ls.priv);
  print('ss:', ss);
  assert.equal(
    ss.toString('hex'),
    'b36b6d195982c5be874d6d542dc268234379e1ae4ff1709402135b7de5cf0766'
  );

  // 4. ck, temp_k3 = HKDF(ck, ss)
  let temp_k3 = await hkdf(ck, ss);
  ck = temp_k3.slice(0, 32);
  temp_k3 = temp_k3.slice(32);
  print('ck:', ck);
  print('temp_k3:', temp_k3);
  assert.equal(
    ck.toString('hex'),
    '919219dbb2920afa8db80f9a51787a840bcf111ed8d588caf9ab4be716e42b01'
  );
  assert.equal(
    temp_k3.toString('hex'),
    '981a46c820fb7a241bc8184ba4bb1f01bcdfafb00dde80098cb8c38db9141520'
  );

  // 5. t = encryptWithAD(temp_k3, 0, h, zero)
  t = encryptWithAD(temp_k3, Buffer.alloc(12), h, '');
  print('t:', t);
  assert.equal(t.toString('hex'), '8dc68b1c466263b47fdf31e560e139ba');

  // 6. sk, rk = hkdf(ck, zero)
  let sk = await hkdf(ck, '');
  let rk = sk.slice(32);
  sk = sk.slice(0, 32);
  print('sk:', sk);
  print('rk:', rk);
  assert.equal(
    sk.toString('hex'),
    '969ab31b4d288cedf6218839b27a3e2140827047f2c0f01bf5c04435d43511a9'
  );
  assert.equal(
    rk.toString('hex'),
    'bb9020b8965f4df047e07f955f3c4b88418984aadc5cdb35096b9ea8fa5c3442'
  );

  // send m = 0 || c || t
  m = Buffer.concat([Buffer.alloc(1), c, t]);
  print('m:', m);
  assert.equal(
    m.toString('hex'),
    '00b9e3a702e93e3a9948c2ed6e5fd7590a6e1c3a0344cfc9d5b57357049aa22355361aa02e55a8fc28fef5bd6d71ad0c38228dc68b1c466263b47fdf31e560e139ba'
  );

  // SEND MESSAGE
  //
  print = _print.bind(undefined, '--> msg 0:');
  console.log();
  print();

  m = Buffer.from('68656c6c6f', 'hex');
  print('m:', m);

  // step 1/2. serialize m length into int16
  let l = Buffer.alloc(2);
  l.writeUInt16BE(m.length);

  // step 3. encrypt l, using chachapoly1305, sn, sk)
  let sn = Buffer.alloc(12);
  let lc = encryptWithAD(sk, sn, Buffer.alloc(0), l);
  print('sn:', sn);
  print('lc:', lc);
  assert.equal(lc.toString('hex'), 'cf2b30ddf0cf3f80e7c35a6e6730b59fe802');

  // step 3a: increment sn, since JS sucks, we can only read UInt32
  // a real implementation of this would need to read the entire UInt64 into BN and do the maths
  // then convert back to a buffer
  sn.writeUInt32LE(sn.readUInt32LE(4) + 1, 4);
  print('sn:', sn);

  // step 4 encrypt m using chachapoly1305, sn, sk
  c = encryptWithAD(sk, sn, Buffer.alloc(0), m);
  print('c:', c);
  assert.equal(c.toString('hex'), '473180f396d88a8fb0db8cbcf25d2f214cf9ea1d95');

  // step 4a: increment sn, since JS sucks, we can only read UInt32
  // a real implementation of this would need to read the entire UInt64 into BN and do the maths
  // then convert back to a buffer
  sn.writeUInt32LE(sn.readUInt32LE(4) + 1, 4);
  print('sn:', sn);

  // step 5 send over wire
  m = Buffer.concat([lc, c]);
  print('m:', m);
  assert.equal(
    m.toString('hex'),
    'cf2b30ddf0cf3f80e7c35a6e6730b59fe802473180f396d88a8fb0db8cbcf25d2f214cf9ea1d95'
  );

  // TEST KEY ROTATION
  //
  function incrementNonce() {
    let newValue = sn.readUInt16LE(4) + 1;
    sn.writeUInt16LE(newValue, 4);
    return newValue;
  }

  async function rotateKeys() {
    print('rotating at', sn.readUInt16LE(4));
    ck = await hkdf(ck, sk);
    sk = ck.slice(32);
    ck = ck.slice(0, 32);
    print('ck:', ck);
    print('sk:', sk);

    sn = Buffer.alloc(12);
  }

  console.log('\n--> messages');
  const ROTATE = 1000;
  for (let i = 1; i <= 1001; i++) {
    print = _print.bind(undefined, `--> msg ${i}:`);

    m = Buffer.from('68656c6c6f', 'hex');
    l = Buffer.alloc(2);
    l.writeUInt16BE(m.length);
    lc = encryptWithAD(sk, sn, Buffer.alloc(0), l);
    if (incrementNonce() >= ROTATE) await rotateKeys();

    c = encryptWithAD(sk, sn, Buffer.alloc(0), m);
    if (incrementNonce() >= ROTATE) await rotateKeys();

    m = Buffer.concat([lc, c]);
    let tests = {
      1: '72887022101f0b6753e0c7de21657d35a4cb2a1f5cde2650528bbc8f837d0f0d7ad833b1a256a1',
      500: '178cb9d7387190fa34db9c2d50027d21793c9bc2d40b1e14dcf30ebeeeb220f48364f7a4c68bf8',
      501: '1b186c57d44eb6de4c057c49940d79bb838a145cb528d6e8fd26dbe50a60ca2c104b56b60e45bd',
      1000: '4a2f3cc3b5e78ddb83dcb426d9863d9d9a723b0337c89dd0b005d89f8d3c05c52b76b29b740f09',
      1001: '2ecd8c8a5629d0d02ab457a0fdd0f7b90a192cd46be5ecb6ca570bfc5e268338b1a16cf4ef2d36',
    };
    if (tests[i]) {
      print('m:', m);
      assert.equal(m.toString('hex'), tests[i]);
    }
  }
}

connect().catch(console.error);
