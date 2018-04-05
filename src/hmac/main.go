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
	chunkSize := 1024
	dataLen := len(data)

	fmt.Println("--> data length", dataLen)
	fmt.Println("--> last byte", dataLen%chunkSize)

	// last block is likely truncated, so we want to get it to 1024 position
	startIndex := dataLen - dataLen%chunkSize
	endIndex := dataLen

	// if for some reason we have a 1024 size mod 0 file, we need to move the
	// start position back by 1024
	if startIndex == endIndex {
		startIndex -= chunkSize
	}

	var hash [32]byte
	for startIndex >= 0 {
		fmt.Printf("processing index %d, size: %d", startIndex, endIndex-startIndex)

		// get the file chunk
		chunk := data[startIndex:endIndex]

		// determine the input (which is just the chunk for the last block or the block + prior hash)
		// for all subsequent blocks
		var input []byte
		if endIndex == dataLen {
			input = chunk
		} else {
			input = append(chunk, hash[:]...)
		}
		fmt.Printf(", input: %d", len(input))

		// sha256 the block
		hash = sha256.Sum256(input)
		fmt.Printf(", %s\n", hex.EncodeToString(hash[:]))

		// set end to the prior start and decrement the start by the block size
		endIndex = startIndex
		startIndex -= chunkSize
	}

	return hash
}
