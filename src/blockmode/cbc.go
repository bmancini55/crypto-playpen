package main

import (
	"crypto/aes"
	"fmt"
)

// CBCEncrypt will encrypt using CBC block mode
func CBCEncrypt(keyBytes []byte, plainTextBytes []byte, ivBytes []byte) []byte {

	// determing if we need a padding block
	padding := 16 - len(plainTextBytes)%16

	fmt.Println("padding is", padding)

	// calculate number of blocks
	blocks := len(plainTextBytes)/16 + 1

	if padding == 16 {
		blocks--
	}

	fmt.Println("blocks", blocks)

	// create output the size of the blocks
	output := make([]byte, 0)

	// create the aes
	aesBlock, _ := aes.NewCipher(keyBytes)

	// do cbc!
	cin := ivBytes
	for i := 0; i < blocks; i++ {
		m := plainTextBytes[i*16 : i*16+16]

		// apply padding to last block
		if i == blocks-1 && padding < 16 {
			for p := 15; p >= 16-padding; p-- {
				m[p] = byte(padding)
			}
		}

		fmt.Printf("pre-xor\n%v\n", m)

		// xor the last cipher with the message
		aesInput := xor(cin, m)

		fmt.Printf("post-xor\n%v\n", aesInput)

		// encrypt the xored message
		cout := make([]byte, 16)
		aesBlock.Encrypt(cout, aesInput)

		fmt.Printf("post aes\n%v\n", cout)

		output = append(output, cout...)

		cin = cout
	}

	// add the padding block if length message length was divisible by 16
	if padding == 16 {
		output = append(output, []byte{16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16}...)
		fmt.Println("appended padding block")
	}

	// return output append to ivbytes
	return append(ivBytes, output...)
}

// CBCDecrypt will decrypt using CBC blockmode
func CBCDecrypt(keyBytes []byte, cipherBytes []byte) []byte {
	ivBytes := cipherBytes[0:16]
	cipherBytes = cipherBytes[16:]

	fmt.Println("iv", ivBytes)
	fmt.Println("cipher", cipherBytes)

	// create the aes
	aesBlock, _ := aes.NewCipher(keyBytes)

	blocks := len(cipherBytes) / 16

	fmt.Println("--> blocks", blocks)

	output := make([]byte, 0)

	c := ivBytes
	for i := 0; i < blocks; i++ {
		block := cipherBytes[i*16 : i*16+16]

		m := make([]byte, 16)
		aesBlock.Decrypt(m, block)

		m = xor(m, c)
		c = block
		fmt.Printf("--> block %d %s\n", i+1, m)

		if i == blocks-1 {
			padding := m[15]
			fmt.Println("--> padding", padding)

			if padding == 16 {
				break
			}
			m = m[0 : 16-padding]
		}

		output = append(output, m...)
	}

	return output
}

func xor(a []byte, b []byte) []byte {
	res := make([]byte, len(a))
	for i, ai := range a {
		res[i] = ai ^ b[i]
	}
	return res
}
