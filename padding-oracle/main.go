package main

import (
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
)

const blockSize int = 16

func main() {
	cStr := "f20bdba6ff29eed7b046d1df9fb7000058b1ffb4210a580f748b4ac714c001bd4a61044426fb515dad3f21f18aa577c0bdf302936266926ff37dbf7035d5eeb4"
	log.Printf(cStr)

	c0, _ := hex.DecodeString(cStr)
	blockCount := len(c0) / blockSize

	// store the decrypted info here
	decrypted := make([]byte, len(c0))

	// decrement the blocks starting from the penultimate block
	for blockIndex := blockCount - 2; blockIndex >= 0; blockIndex-- {
		decryptedBlock := make([]byte, blockSize)

		// start at the last position in the block
		// and decrement until the first byte
		for pos := 15; pos >= 0; pos-- {

			// we will use this to handle 200 responses when we
			// are processing the padding.  if there are no successful
			// hits then we will use this value.  it is necessary to
			// account for the last padding byte, since it will create
			// a valid MAC and will return 200
			possible := byte(0)

			// iterate all possible bytes
			for g := 0; g < 256; g++ {

				// copy a chunk of the original message to a new buffer that we can mutate.
				// this buffer will lop off the last block to allow us to do the padding oracle.
				// for instance, if we are working on blockIndex 2, we have 4 blocks of data.
				// since we are mutating blockIndex 2 to discover blockIndex 3.
				c := make([]byte, (blockIndex+2)*16)
				copy(c, c0[:(blockIndex+2)*16])

				// take a slice of the current block to make mutation easier
				block := c[blockIndex*16 : blockIndex*16+16]

				// modify the position by g
				block[pos] ^= byte(g)

				// xor the decrypted values into their respected positions
				xorDecrypted(block, decryptedBlock)

				// xor the padding value from our position forward
				// ie: if we are on pos 15, then we are looking for a padding
				// value of 0x01.  if we are on 14, then we need 0x02 on 14, 15
				// positions.
				xorPadding(block[pos:], 16-pos)

				// log.Printf(hex.EncodeToString(c))

				// make the connection and return the result
				result := attack(c)

				// 404 when mac fails
				// 403 when padding is incorrect
				// 200 when success
				if result == 404 {
					decryptedBlock[pos] = byte(g)
					break
				}

				// adding this to account for the last block
				// when padding is actually accurate it will
				// be a valid message. in this last block
				// we can get false positives in the padding area
				if result == 200 {
					possible = byte(g)
				}

				// if we reached the end, check if there
				// were any possible successful responses
				// and if there were, we can use that
				// otherwise we failed
				if g == 255 {
					if possible > 0 {
						decryptedBlock[pos] = possible
					} else {
						log.Fatal("Failed")
					}
				}
			}

			copy(decrypted[(blockIndex+1)*16:(blockIndex+2)*16], decryptedBlock)
			fmt.Println(decrypted[16:])
		}
	}

	fmt.Println(string(decrypted))
}

func xorDecrypted(slice []byte, decrypted []byte) {
	for i := 0; i < len(slice); i++ {
		slice[i] ^= decrypted[i]
	}
}

func xorPadding(slice []byte, padlen int) {
	for i := 0; i < len(slice); i++ {
		slice[i] ^= byte(padlen)
	}
}

func attack(data []byte) int {
	po := hex.EncodeToString(data)
	resp, _ := http.Get("http://crypto-class.appspot.com/po?er=" + po)
	return resp.StatusCode
}
