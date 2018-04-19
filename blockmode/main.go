package main

import (
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

	if *decryptFlag && *cipherText == "" {
		log.Fatalln("Ciphertext is required")
	}

	keyBytes, err := hex.DecodeString(*key)
	if err != nil {
		log.Fatalln("Key must be hex")
	}

	if *blockmode == "CBC" {
		if *encryptFlag {
			plainTextBytes := []byte(*plainText)
			ivBytes, err := hex.DecodeString(*iv)

			if err != nil {
				log.Fatalln("iv must be hex")
			}

			if len(ivBytes) != 16 {
				log.Fatalln("iv length must be 16 bytes")
			}

			result := CBCEncrypt(keyBytes, plainTextBytes, ivBytes)
			fmt.Println(hex.EncodeToString(result))

		} else {
			cipherBytes, err := hex.DecodeString(*cipherText)
			if err != nil {
				log.Fatalln("cipherBytes must be hex")
			}

			result := CBCDecrypt(keyBytes, cipherBytes)
			fmt.Println(string(result))
		}
	}

	if *blockmode == "CTR" {
		if *encryptFlag {
			plainTextBytes := []byte(*plainText)

			ivBytes := make([]byte, 16, 16)

			fmt.Println("iv", *iv)
			if *iv != "" {
				iv, err := hex.DecodeString(*iv)

				if err != nil {
					log.Fatalln("iv must be hex")
				}

				if len(iv) != 16 {
					log.Fatalln("iv length must be 16 bytes")
				}

				ivBytes = iv
			}

			result := CTREncrypt(keyBytes, plainTextBytes, ivBytes)
			fmt.Println(hex.EncodeToString(result))
		} else {
			cipherBytes, err := hex.DecodeString(*cipherText)
			if err != nil {
				log.Fatalln("cipherBytes must be hex")
			}

			result := CTRDecrypt(keyBytes, cipherBytes)
			fmt.Println(string(result))
		}
	}
}
