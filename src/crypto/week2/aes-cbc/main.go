package main

import (
	"crypto/aes"
	"encoding/hex"
	"flag"
	"fmt"
	"log"
)

func main() {
	blockmode := flag.String("blockmode", "cbc", "Block mode (cbc, ctr)")

	encryptFlag := flag.Bool("encrypt", false, "Encrypt mode")
	decryptFlag := flag.Bool("decrypt", false, "Decrypt mode")

	key := flag.String("key", "", "Key")

	plainText := flag.String("plaintext", "", "Plaintext for encrypt mode")
	iv := flag.String("iv", "", "Initialization vector for encrypt mode")

	cipherText := flag.String("cipher", "", "Cipher text for decrypt mode")

	flag.Parse()

	if *key == "" {
		log.Fatalln("Key is required")
	}

	if !*encryptFlag && !*decryptFlag {
		log.Fatalln("Requires encrypt or decrypt mode")
	}

	if *encryptFlag && *plainText == "" {
		log.Fatalln("Plantext is required to encrypt")
	}

	if *encryptFlag && *iv == "" {
		log.Fatalln("Initialization vector is required")
	}

	if *decryptFlag && *cipherText == "" {
		log.Fatalln("Ciphertext is required")
	}

	keyBytes, err := hex.DecodeString(*key)
	if err != nil {
		log.Fatalln("Key must be hex")
	}

	if *encryptFlag && *blockmode == "CBC" {
		plainTextBytes := []byte(*plainText)
		ivBytes, err := hex.DecodeString(*iv)

		if err != nil {
			log.Fatalln("iv must be hex")
		}

		if len(ivBytes) != 16 {
			log.Fatalln("iv length must be 16 bytes")
		}

		result := cbcEncrypt(keyBytes, plainTextBytes, ivBytes)
		fmt.Println(hex.EncodeToString(result))

	} else if *decryptFlag && *blockmode == "CBC" {
		cipherBytes, err := hex.DecodeString(*cipherText)
		if err != nil {
			log.Fatalln("cipherBytes must be hex")
		}

		result := cbcDecrypt(keyBytes, cipherBytes)
		fmt.Println(string(result))
	}

	if *blockmode == "CTR" {
		cipherBytes, err := hex.DecodeString(*cipherText)
		if err != nil {
			log.Fatalln("cipherBytes must be hex")
		}

		result := ctrDecrypt(keyBytes, cipherBytes)
		fmt.Println(string(result))
	}

}

func cbcEncrypt(keyBytes []byte, plainTextBytes []byte, ivBytes []byte) []byte {

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

		aesInput := xor(cin, m)

		fmt.Printf("post-xor\n%v\n", aesInput)

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

func cbcDecrypt(keyBytes []byte, cipherBytes []byte) []byte {
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

func ctrDecrypt(keyBytes []byte, cipherBytes []byte) []byte {
	ivBytes := cipherBytes[0:16]
	cipherBytes = cipherBytes[16:]

	fmt.Println("iv", ivBytes)
	fmt.Println("cipher", cipherBytes)

	// create the aes
	aesBlock, _ := aes.NewCipher(keyBytes)

	blocks := len(cipherBytes)/16 + 1

	fmt.Println("--> blocks", blocks)

	output := make([]byte, 0)

	for i := 0; i < blocks; i++ {
		block := cipherBytes[i*16 : i*16+16]

		m := make([]byte, 16)
		aesBlock.Encrypt(m, ivBytes)

		m = xor(block, m)

		fmt.Printf("--> block: %d %s\n", i+1, m)

		output = append(output, m...)
		ivBytes[15]++
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
