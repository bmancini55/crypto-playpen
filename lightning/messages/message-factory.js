const winston = require('winston');

const typeMap = {
  16: require('./init-message'),
  17: require('./error-message'),
  18: require('./ping-message'),
  19: require('./pong-message'),
  256: require('./channel-announcement'),
  258: require('./channel-update'),
  259: require('./announcement-signatures-message'),
};

function constructType(type) {
  return typeMap[type];
}

function deserialize(buffer) {
  let type = buffer.readUInt16BE();
  let payload = buffer.slice(2);

  let Type = constructType(type);
  if (Type) return Type.deserialize(payload);
  else winston.warn('unknown message type', type);
}

function construct(type, args) {
  let Type = constructType(type);
  return new Type(args);
}

module.exports = {
  deserialize,
  construct,
};
