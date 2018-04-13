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
	c0, _ := hex.DecodeString(cStr)
	blockCount := len(c0) / blockSize
	log.Printf(cStr)

	// store the decrypted info here
	decrypted := make([]byte, len(c0))

	// decrement the blocks starting from the penultimate block
	for blockIndex := blockCount - 2; blockIndex >= 0; blockIndex-- {
		decryptedBlock := make([]byte, blockSize)

		// decrement the positions in the block
		for pos := 15; pos >= 0; pos-- {
			index := blockIndex*blockSize + pos

			// we will use this to handle 200 responses when we
			// are processing the padding.  if there are no successful
			// hits then we will use this value.  it is necessary to
			// account for the last padding byte, since it will create
			// a valid MAC and will return 200
			possible := byte(0)

			// iterate all possible bytes
			for g := 0; g < 256; g++ {

				// copy the original message to a test buffer
				c := make([]byte, (blockIndex+2)*16)
				copy(c, c0[:(blockIndex+2)*16])

				pad := 16 - pos

				c[index] ^= byte(g)
				xorDecrypted(c[blockIndex*16:blockIndex*16+16], decryptedBlock)
				xorPadding(c[index:index+pad], pad)

				log.Printf(hex.EncodeToString(c))

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
