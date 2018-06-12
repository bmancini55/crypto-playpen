const secp256k1 = require('secp256k1');
const tinysecp256k1 = require('tiny-secp256k1');
const elliptic = require('elliptic').ec('secp256k1');

const msg = Buffer.from('c3d4e83f646fa79a393d75277b1d858db1d1f7ab7137dcb7835db2ecd518e1c9', 'hex');
const key = Buffer.from('e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734', 'hex');
const iters = 5000;

function run(lib, fn) {
  console.time(lib);
  for (let i = 0; i < iters; i++) {
    fn();
  }
  console.timeEnd(lib);
}

run('sign with secp256k1     ', () => secp256k1.sign(msg, key));
run('sign with tiny-secp256k1', () => tinysecp256k1.sign(msg, key));
run('sign with elliptic      ', () => elliptic.sign(msg, key));
