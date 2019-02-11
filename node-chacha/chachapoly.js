const crypto = require('crypto');

// const plaintext = Buffer.from(
//   '4c616469657320616e642047656e746c656d656e206f662074686520636c617373206f66202739393a204966204920636f756c64206f6666657220796f75206f6e6c79206f6e652074697020666f7220746865206675747572652c2073756e73637265656e20776f756c642062652069742e',
//   'hex'
// );
// const key = Buffer.from('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f', 'hex');
// const iv = Buffer.from('0000000000000004a00000000', 'hex');

const key = Buffer.from('e68f69b7f096d7917245f5e5cf8ae1595febe4d4644333c99f9c4a1282031c9f', 'hex');
const iv = Buffer.from('000000000000000000000000', 'hex');
const ad = Buffer.from('9e0e7de8bb75554f21db034633de04be41a2b8a18da7a319a03c803bf02b396c', 'hex');
const plaintext = Buffer.alloc(0);

function encrypt(plaintext, ad) {
  const encryptor = crypto.createCipheriv('ChaCha20-Poly1305', key, iv);
  encryptor.setAAD(ad);
  let pad = encryptor.update(plaintext);

  encryptor.final();
  //let tag = encryptor.getAuthTag();

  //return Buffer.concat([pad, tag]);
  return pad;
}

console.log(encrypt(plaintext, ad).toString('hex'));

/*
k, n, ad, plaintext
encryptWithAD(
  0xe68f69b7f096d7917245f5e5cf8ae1595febe4d4644333c99f9c4a1282031c9f,
  0x000000000000000000000000,
  0x9e0e7de8bb75554f21db034633de04be41a2b8a18da7a319a03c803bf02b396c, <empty>)
c=0df6086551151f58b8afe6c195782c6a
*/
