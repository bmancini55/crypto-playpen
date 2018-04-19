package main

import (
	"crypto/aes"
	"encoding/binary"
	"fmt"
)

// CTREncrypt will decrypt using CTR block mode
func CTREncrypt(keyBytes []byte, plaintextBytes []byte, ivBytes []byte) []byte {
	fmt.Println("--> plaintext", plaintextBytes)
	fmt.Println("--> iv", ivBytes)

	// create the aes cipher
	aesBlock, _ := aes.NewCipher(keyBytes)

	// determine the number of blocks by dividing by 16
	// and because we truncate any remained, we need to add 1
	// ie: 1/16 = 0 + 1 = 1 block
	blocks := len(plaintextBytes)/16 + 1

	// determine if we will need to truncate the last block
	// also if the block is 16, then the above calculation will
	// be off, so we need to reduce by 1
	lastBlockLen := len(plaintextBytes) % 16

	// since the blocks calcuation == 16 would be 1, the + 1 will
	// cause an issue.  this is a crappy way to do this, we should
	// stream this so it's not so terrible
	if lastBlockLen == 16 {
		blocks--
	}

	fmt.Println("--> blocks", blocks)

	output := make([]byte, 0)

	// prepend with iv
	output = append(output, ivBytes...)

	// iterate the blocks
	for i := 0; i < blocks; i++ {

		// grab the slice of byes for the block
		block := plaintextBytes[i*16 : i*16+16]

		// encrypt the iv with the key
		m := make([]byte, 16)
		aesBlock.Encrypt(m, ivBytes)

		// xor the encrypted ivBytes with the message!
		m = xor(block, m)

		// if last block, truncate to the size of the message
		if i == blocks-1 {
			m = m[:lastBlockLen]
		}

		fmt.Printf("--> block: %d %s\n", i+1, m)

		output = append(output, m...)

		// increment the IV by taking the counter (last 8 bytes)
		// converting to an uint64 and incrementing it
		// this could easily be replaced with an actual bitwise addition
		nextIv := binary.BigEndian.Uint64(ivBytes[8:])
		nextIv++
		binary.BigEndian.PutUint64(ivBytes[8:], nextIv)
	}

	return output
}

// CTRDecrypt will decrypt using CTR block mode
func CTRDecrypt(keyBytes []byte, cipherBytes []byte) []byte {
	ivBytes := cipherBytes[0:16]
	cipherBytes = cipherBytes[16:]

	fmt.Println("iv", ivBytes)
	fmt.Println("cipher", cipherBytes)

	// create the aes cipher
	aesBlock, _ := aes.NewCipher(keyBytes)

	// determine the number of blocks by dividing by 16
	// and because we truncate any remained, we need to add 1
	// ie: 1/16 = 0 + 1 = 1 block
	blocks := len(cipherBytes)/16 + 1

	// determine if we will need to truncate the last block
	// also if the block is 16, then the above calculation will
	// be off, so we need to reduce by 1
	lastBlockLen := len(cipherBytes) % 16

	// since the blocks calcuation == 16 would be 1, the + 1 will
	// cause an issue.  this is a crappy way to do this, we should
	// stream this so it's not so terrible
	if lastBlockLen == 16 {
		blocks--
	}

	fmt.Println("--> blocks", blocks)

	output := make([]byte, 0)

	// iterate the blocks
	for i := 0; i < blocks; i++ {

		// grab the slice of byes for the block
		block := cipherBytes[i*16 : i*16+16]

		// encrypt the iv with the key
		m := make([]byte, 16)
		aesBlock.Encrypt(m, ivBytes)

		// xor the encrypted ivBytes with the message!
		m = xor(block, m)

		// if last block, truncate to the size of the message
		if i == blocks-1 {
			m = m[:lastBlockLen]
		}

		fmt.Printf("--> block: %d %s\n", i+1, m)

		output = append(output, m...)

		// increment the IV by taking the counter (last 8 bytes)
		// converting to an uint64 and incrementing it
		// this could easily be replaced with an actual bitwise addition
		nextIv := binary.BigEndian.Uint64(ivBytes[8:])
		nextIv++
		binary.BigEndian.PutUint64(ivBytes[8:], nextIv)
	}

	return output
}
