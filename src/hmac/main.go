package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io/ioutil"
	"log"
	"os"
)

func main() {
	filename := os.Args[1]
	if filename == "" {
		log.Fatalln("file is required")
	}

	fileBytes := readFile(filename)
	result := hmac(fileBytes)
	fmt.Println(hex.EncodeToString(result[:]))
}

func readFile(filename string) []byte {
	bytes, err := ioutil.ReadFile(filename)
	if err != nil {
		panic(err)
	}
	return bytes
}

func hmac(data []byte) [32]byte {
	dataLen := len(data)
	lastChunkSize := dataLen % 1024

	fmt.Println("--> data length", dataLen)
	fmt.Println("--> last byte", lastChunkSize)

	startIndex := dataLen - lastChunkSize
	endIndex := dataLen

	var hash [32]byte

	for {
		fmt.Printf("processing index %d, size: %d", startIndex, endIndex-startIndex)
		chunk := data[startIndex:endIndex]
		if endIndex == dataLen {
			fmt.Printf(", input: 0")
			hash = sha256.Sum256(chunk)
			startIndex -= 1024
			endIndex -= lastChunkSize
		} else {
			input := append(chunk, hash[:]...)
			fmt.Printf(", input: %d", len(input))
			hash = sha256.Sum256(input)
			startIndex -= 1024
			endIndex -= 1024
		}

		fmt.Printf(", %s\n", hex.EncodeToString(hash[:]))

		if startIndex < 0 {
			break
		}
	}

	return hash
}
