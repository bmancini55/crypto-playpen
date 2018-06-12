const crypto = require('crypto');
const hashjs = require('hash.js');
const fastsha256 = require('fast-sha256');
const createhash = require('create-hash');

const msg = 'hello world';

function run(label, fn) {
  console.time(label);
  for (let i = 0; i < 100000; i++) {
    fn();
  }
  console.timeEnd(label);
}

function nativefn() {
  let sha256 = crypto.createHash('sha256');
  sha256.update(msg);
  return sha256.digest();
}

function hashjsfn() {
  return hashjs
    .sha256()
    .update(msg)
    .digest();
}

function fashsha256fn() {
  return fastsha256(msg);
}

function createhashfn() {
  let hash = createhash('sha256');
  hash.update(msg);
  return hash.digest();
}

run('sha256 native    ', nativefn);
run('sha256 hashjs    ', hashjsfn);
run('sha256 fastsha256', fashsha256fn);
run('sha256 createhash', createhashfn);
