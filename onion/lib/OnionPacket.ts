import { OnionPayload } from "./OnionPayload";

export class OnionPacket {
  constructor(
    readonly version: number,
    readonly payload: OnionPayload,
    readonly ephemeralPoint?: Buffer,
    readonly hmac?: Buffer
  ) {}
}
