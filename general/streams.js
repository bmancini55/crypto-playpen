const net = require('net');

// lets create a server that only read in 64-bit (8-byte) chunks
let buffers = [];

let server = new net.Server(socket => {
  socket.on('data', d => {
    buffers.push(d);
    if (hasLength(buffers, 8)) {
      console.log(readFromBuffers(buffers, 8).toString());
    }
  });
});

function hasLength(buffers, len) {
  let sum = 0;
  for (let buffer of buffers) {
    sum += buffer.length;
    if (sum >= len) return true;
  }
  return false;
}

function readFromBuffers(buffers, len) {
  let result = Buffer.alloc(len);
  let position = 0;
  let remaining = () => len - position;

  while (buffers.length > 0 && position < len) {
    let buffer = buffers[0];
    if (buffer.length > remaining()) {
      buffer.copy(result, position, 0, remaining());
      buffers[0] = buffer.slice(remaining());
      position += remaining();
      console.log('>', buffers, remaining());
    } else if (buffer.length === remaining()) {
      buffer.copy(result, position, 0, remaining());
      buffers.shift();
      position += remaining();
      console.log('=', buffers, remaining());
    } else {
      buffer.copy(result, position, 0);
      position += buffer.length;
      buffers.shift();
      console.log('<', buffers, remaining());
    }
  }
  return result;
}

server.listen(9000);
console.log('listening on 9000');
