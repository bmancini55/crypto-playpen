const net = require('net');

let server = new net.Server(socket => {
  socket.on('readable', () => {
    let data = socket.read(8);
    if (data) {
      if (data.length === 8) console.log(data.toString());
      else console.log('discarding', data.toString());
    }
  });
});

server.listen(9001);
console.log('listening on 9001');
