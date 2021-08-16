export class OnionPayload {
  constructor(readonly data?: Buffer, readonly nextPayload?: Buffer, readonly nextHmac?: Buffer) {}
}
