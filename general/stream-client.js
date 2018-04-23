const net = require('net');
let port = 9001;

let socket = net.createConnection({ port }, () => {
  console.log('connected to ' + port);
  setInterval(sayHello, 3000);
});
socket.on('error', e => {
  console.log(e);
  process.exit(1);
});

function sayHello() {
  console.log('saying hello');
  socket.write(Buffer.from('hello'));
}

process.stdin.resume();
