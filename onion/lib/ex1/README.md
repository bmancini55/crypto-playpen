# Stupid Example

This is an example construction that provides zero confidentiality,
integrity, or privacy.

The onion construction simply "wraps" the prior data by prepending the
new data to it.

There is no confidentiality as no obfuscation of data is used.
There is no integrity as no MACs are used.
There is no privacy because you can see how many hops exist in the path.

## Building

If you have data parts `11111111` and `22222222` for hops 1 and 2
respectively...

Inner onion: `2222222`
Outer onion: `11111111` + `22222222`

## Reading

To read is quite simple. Each hop reads the data (which is fixed
length in this example) from the front of the packet. Removes its
data from the packet, and forwards on the remainder of the data.

Hop1 input: `1111111122222222`
Hop1 extracts: `11111111`
Hop1 forwards: `22222222`

Hop2 input: `22222222`
Hop2 extracts: `22222222`
Hop2 forwrds: N/A
