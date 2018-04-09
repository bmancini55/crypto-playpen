const crypto = require('crypto');
const iv = Buffer.from('6c7f6d146746dc6fec5ae61431f046b8', 'hex'); // crypto.randomBytes(16);
const key = Buffer.from('4f2f71871efcadd9a3f5d27492222fecd55c8af8c3cb8c737e3590dd35685398', 'hex'); //crypto.randomBytes(32);

const m = 'brian: hello world';
console.log('original:', m);

// we start by performing aes-256-ctr mode...
// can't use GCM mode because it includes authenication
const cipher = crypto.createCipheriv('AES-256-CTR', key, iv);
let encrypted = cipher.update(m, 'utf8');
encrypted = Buffer.concat([encrypted, cipher.final()]);
console.log('cipher:  ', encrypted);
// <Buffer a2 5b 18 07 36 dc 15 3f f4 dd d4 77 d9 3e 2f db 98 f6>

// lets say an attacker intercepts the ciphrtext and wants
// and can correctly guess that the message starts with 'brian'.
// an attacker can mutate brian into whatever they like by doing some simple XOR maths

// start by creating an xor of the thing we want to replace with the thing we will replace it with
let inject = xor(Buffer.from('brian'), Buffer.from('ralph'));
console.log('inject:  ', inject);
// <Buffer 10 13 05 11 06>

// then xor that into the ciphertext
encrypted = xor(encrypted, inject);
console.log('mitm out:', encrypted);
// <Buffer b2 48 1d 16 30 dc 15 3f f4 dd d4 77 d9 3e 2f db 98 f6>

let decipher = crypto.createDecipheriv('AES-256-CTR', key, iv);
let output = decipher.update(encrypted);
output = Buffer.concat([output, decipher.final()]);
console.log('hacked:  ', output.toString());
// ralph: hello world

function xor(b1, b2) {
  let result = Buffer.alloc(b1.length);
  for (let i = 0; i < b1.length; i++) {
    if (i < b2.length) result[i] = b1[i] ^ b2[i];
    else result[i] = b1[i];
  }
  return result;
}
