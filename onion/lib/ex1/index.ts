/**
 * This example is really stupid but it acts as the foundation for
 * building cryptographic onions that actually protect information. This
 * construction simply takes the data and builds a linear ordering of
 * the data. There is no MAC, no shared secrets, nothing.
 *
 * As a result, any observer can see the data. Any observer can see
 * how many hops there are. Any hop can tamper with the data. So we
 * completely lack anonymity, confidentiality, and integrity.
 *
 * @param info - data to wrap in onion for each hop
 */
export function build(info: Buffer[]): Buffer {
  let lastHopData: Buffer = Buffer.alloc(0);

  // Iterate in reverse order to construct our onion from the center
  // to the outside. This is not required for this implementation since
  // there is no cryptographic wrapping, however we can use a similar
  // construct in future implementations that improve on how things work.
  while (info.length) {
    // Extract the currrent hop information
    const currentHopData = info.pop();
    console.log("data  ", currentHopData.toString("hex"));

    // Prepend the current hop information to the existing information
    lastHopData = Buffer.concat([currentHopData, lastHopData]);
    console.log("onion ", lastHopData.toString("hex"));
    console.log("");
  }

  // Return the outter layer of the onion
  return lastHopData;
}

/**
 * Reads info from the packet. No verification of information is
 * performed. This code simply reads from the front of the packet,
 * removes its information and then forwards on the remainder of the
 * packet.
 *
 * Any node could tamper with information along the way. And since there
 * is no decryption, anyone can see the information (no confidentiality).
 *
 * @param packet
 */
export function read(packet: Buffer): Buffer {
  // Read this hop's info from the front of the packet
  const data = packet.slice(0, 4);
  console.log("data  ", data.toString("hex"));
  console.log("");

  // Forward the remainder of the packet to the next
  const remainder = packet.slice(4);
  return remainder;
}
