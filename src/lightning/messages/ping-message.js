class PingMessage {
  constructor() {
    this.type = 18;
    this.num_pong_bytes = 1;
    this.byteslen = 0;
    this.ignored = Buffer.alloc(0);
  }

  static deserialize(payload) {
    let instance = new PingMessage();
    instance.num_pong_bytes = payload.readUInt16BE(0);
    instance.byteslen = payload.readUInt16BE(2);
    instance.ignored = payload.slice(4);
    return instance;
  }

  serialize() {
    let result = Buffer.alloc(2 + 2 + 2 + this.byteslen);
    result.writeUInt16BE(this.type, 0);
    result.writeUInt16BE(this.num_pong_bytes, 2);
    result.writeUInt16BE(this.byteslen, 4);
    for (let i = 0; i < this.ignored.length; i++) {
      result.writeUInt8(this.ignored[i], 6 + i);
    }
    return result;
  }
}

module.exports = PingMessage;
