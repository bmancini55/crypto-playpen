package main

import (
	"encoding/hex"
	"fmt"
)

func main() {
	iv, _ := hex.DecodeString("20814804c1767293b99f1d9cab3bc3e7")

	m0 := make([]byte, 16)
	m1 := make([]byte, 16)
	copy(m0, []byte("Pay Bob 100$"))
	copy(m1, []byte("Pay Bob 500$"))

	fmt.Println(hex.EncodeToString(xor(xor(iv, m0), m1)))
}

func xor(a, b []byte) []byte {
	result := make([]byte, len(a))
	for i := 0; i < len(a); i++ {
		result[i] = a[i] ^ b[i]
	}
	return result
}
