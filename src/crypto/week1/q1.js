let c1 = Buffer.from('6c73d5240a948c86981bc294814d', 'hex');
let m1 = Buffer.from('attack at dawn');
let m2 = Buffer.from('attack at dusk');

let k = Buffer.alloc(m1.length);

for (let i = 0; i < m1.length; i++) {
  let m1byte = m1[i];
  let cbyte = c1.readUInt8(i);

  k[i] = m1byte ^ cbyte;

  console.log(m1byte, cbyte, k[i]);
}

let c2 = Buffer.alloc(c1.length);
for (let i = 0; i < m2.length; i++) {
  c2[i] = m2[i] ^ k[i];
}

console.log(c2.toString('hex'));
