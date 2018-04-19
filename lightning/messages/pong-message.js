const BufferReader = require('../buffer-reader');
const BufferWriter = require('../buffer-writer');

class PongMessage {
  constructor() {
    this.type = 19;
    this.ignored;
  }

  static deserialize(payload) {
    let instance = new PongMessage();
    let reader = BufferReader.from(payload);
    let byteslen = reader.readUInt16BE();
    instance.ignored = reader.readBytes(byteslen);
    return instance;
  }

  serialize() {
    let result = Buffer.alloc(4 + this.ignored.length);
    let writer = BufferWriter.from(result);
    writer.writeUInt16BE(this.type);
    writer.writeUInt16BE(this.ignored.length);
    writer.writeBytes(this.ignored);
    return result;
  }

  createReply(num_pong_bytes) {
    this.ignored = Buffer.alloc(num_pong_bytes);
  }
}

module.exports = PongMessage;
