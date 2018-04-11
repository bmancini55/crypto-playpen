const winston = require('winston');
const InitMessage = require('./init-message');
const PingMessage = require('./ping-message');
const PongMessage = require('./pong-message');

function deserialize(buffer) {
  let type = buffer.readUInt16BE();
  let payload = buffer.slice(2);
  switch (type) {
    case 16:
      return InitMessage.deserialize(payload);
    case 18:
      return PingMessage.deserialize(payload);
    case 19:
      return PongMessage.deserialize(payload);
    default:
      winston.warn('unknown message type', type);
  }
}

function construct(type) {
  switch (type) {
    case 16:
      return new InitMessage();
    case 18:
      return new PingMessage();
    case 19:
      return new PongMessage();
  }
}

module.exports = {
  deserialize,
  construct,
};
