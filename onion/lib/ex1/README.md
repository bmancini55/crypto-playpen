# Stupid Example

This is an example construction that provides zero confidentiality,
integrity, or privacy.

The onion construction simply "wraps" the prior data by prepending the
new data to it.

There is no confidentiality as no obfuscation of data is used.
There is no integrity as no MACs are used.
There is no privacy because you can see how many hops exist in the path.

## Building

If you have data parts that are each 4-bytes: `11111111` and `22222222`
for hops 1 and 2 respectively...

Inner onion: `0422222222`
Outer onion: `0411111111` + `0422222222`

## Reading

To read is quite simple. Each hop strips and reads the length byte and
associated data from the front of the packet. It then forwards the
remainder of the data.

Hop1 input: `04111111110422222222`
Hop1 extracts: `0411111111`
Hop1 forwards: `0422222222`

Hop2 input: `0422222222`
Hop2 extracts: `0422222222`
Hop2 forwards: N/A
