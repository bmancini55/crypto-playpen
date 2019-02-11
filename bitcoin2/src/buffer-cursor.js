const assert = require('assert');
const BN = require('bn.js');

class BufferCursor {
  constructor(buffer) {
    assert(Buffer.isBuffer(buffer), 'Requires a buffer');
    this._buffer = buffer;
    this._position = 0;
  }

  get position() {
    return this._position;
  }

  get eof() {
    return this._position === this._buffer.length;
  }

  get buffer() {
    return this._buffer;
  }

  readUInt8() {
    return this._readStandard(this.readUInt8.name, 1);
  }

  readUInt16LE() {
    return this._readStandard(this.readUInt16LE.name, 2);
  }

  readUInt16BE() {
    return this._readStandard(this.readUInt16BE.name, 2);
  }

  readUInt32LE() {
    return this._readStandard(this.readUInt32LE.name, 4);
  }

  readUInt32BE() {
    return this._readStandard(this.readUInt32BE.name, 4);
  }

  readBytes(len) {
    if (len === 0) {
      return Buffer.alloc(0);
    } else if (len > 0) {
      if (this._position + len > this._buffer.length) throw new RangeError('Index out of range');
      let result = this._buffer.slice(this._position, this._position + len);
      this._position += len;
      return result;
    } else {
      if (this._position === this._buffer.length) throw new RangeError('Index out of range');
      let result = this._buffer.slice(this._position);
      this._position = this._buffer.length;
      return result;
    }
  }

  writeUInt8(val) {
    this._writeStandard(this.writeUInt8.name, val, 1);
  }

  writeUInt16LE(val) {
    this._writeStandard(this.writeUInt16LE.name, val, 2);
  }

  writeUInt16BE(val) {
    this._writeStandard(this.writeUInt16BE.name, val, 2);
  }

  writeUInt32LE(val) {
    this._writeStandard(this.writeUInt32LE.name, val, 4);
  }

  writeInt32LE(val) {
    this._writeStandard(this.writeInt32LE.name, val, 4);
  }

  writeUInt32BE(val) {
    this._writeStandard(this.writeUInt32BE.name, val, 4);
  }

  writeUInt64LE(value) {
    if (!(value instanceof BN)) value = new BN(value);
    this.writeBytes(value.toBuffer('le', 8));
  }

  writeBytes(buffer) {
    if (!buffer || !buffer.length) return;
    if (this._position + buffer.length > this._buffer.length)
      throw new RangeError('Index out of range');
    buffer.copy(this._buffer, this._position);
    this._position += buffer.length;
  }

  _readStandard(fn, len) {
    let result = this._buffer[fn](this._position);
    this._position += len;
    return result;
  }

  _writeStandard(fn, val, len) {
    this._buffer[fn](val, this._position);
    this._position += len;
  }
}

module.exports = BufferCursor;
