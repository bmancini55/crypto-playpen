module.exports = {
  mergeBufs,
};

function mergeBufs(buf1, buf2) {
  return Buffer.concat([buf1, buf2]);
}
