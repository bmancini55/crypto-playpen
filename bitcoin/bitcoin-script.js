function readbyte(iter) {
  let { value, done } = iter.next();
  if (done) return;
  let [idx, byte] = value;
  return byte;
}

function readbytes(iter, len) {
  let bytes = Buffer.alloc(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = readbyte(iter);
  }
  return bytes;
}

function parseScript(scriptHex) {
  let buffer = Buffer.from(scriptHex, 'hex');
  let iter = buffer.entries();
  let byte;
  let stack = [];
  while (true) {
    byte = readbyte(iter);
    if (byte === undefined) return;

    // data length
    if (byte >= 0x01 && byte <= 0x4b) {
      let data = readbytes(iter, byte); // read data of length
      stack.push({ op: 'data', len: byte, data: data.toString('hex') });
    } else if (byte == 0xac) {
      stack.push({ op: 'OP_CHECKSIG' });
    } else {
      stack.push({ op: 'UNKNOWN', data: byte });
    }

    console.log(stack.slice().reverse());
  }
}

let pkscript =
  '4104678AFDB0FE5548271967F1A67130B7105CD6A828E03909A67962E0EA1F61DEB649F6BC3F4CEF38C4F35504E51EC112DE5C384DF7BA0B8D578A4C702B6BF11D5FAC';
let scriptsig =
  '04FFFF001D0104455468652054696D65732030332F4A616E2F32303039204368616E63656C6C6F72206F6E206272696E6B206F66207365636F6E64206261696C6F757420666F722062616E6B73';

parseScript(scriptsig);
