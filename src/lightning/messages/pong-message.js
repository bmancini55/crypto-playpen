class PongMessage {
  constructor() {
    this.type = 19;
    this.byteslen = 0;
    this.ignored = Buffer.alloc(0);
  }

  static deserialize(payload) {
    let instance = new PongMessage();
    instance.byteslen = payload.readUInt16BE(0);
    instance.ignored = payload.slice(2);
    return instance;
  }

  serialize() {
    let result = Buffer.alloc(2 + 2 + this.byteslen);
    result.writeUInt16BE(this.type, 0);
    result.writeUInt16BE(this.byteslen, 2);
    result.write(this.ignored, 4);
    return result;
  }
}

module.exports = PongMessage;
