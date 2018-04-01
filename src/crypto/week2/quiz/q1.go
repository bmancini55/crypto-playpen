package main

import (
	"encoding/hex"
	"fmt"
)

func main() {
	run1()
}

func run1() {
	tests := [][]string{
		{"290b6e3a39155d6f", "d6f491c5b645c008"},
		{"5f67abaf5210722b", "bbe033c00bc9330e"},
		{"9d1a4f78cb28d863", "75e5e3ea773ec3e6"},
		{"7b50baab07640c3d", "ac343a22cea46d60"},
	}

	for _, test := range tests {
		r2, _ := hex.DecodeString(test[0])
		l2, _ := hex.DecodeString(test[1])

		xor := make([]byte, len(r2))
		for i := range r2 {
			xor[i] = r2[i] ^ l2[i]
		}

		fmt.Println(hex.EncodeToString(xor))
	}
}
