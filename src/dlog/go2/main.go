package main

import (
	"encoding/hex"
	"flag"
	"fmt"
	"math/big"
	"time"
)

func main() {
	var pStr = flag.String("p", "", "p - prime number")
	var gStr = flag.String("g", "", "g")
	var hStr = flag.String("h", "", "h")
	var BStr = flag.String("B", "", "B")

	flag.Parse()

	start := time.Now()
	p := big.NewInt(0)
	p.SetString(*pStr, 10)

	g := big.NewInt(0)
	g.SetString(*gStr, 10)

	h := big.NewInt(0)
	h.SetString(*hStr, 10)

	B := big.NewInt(0)
	B.SetString(*BStr, 10)

	fmt.Println("p", p)
	fmt.Println("g", g)
	fmt.Println("h", h)

	lookup := buildLeftLookup(p, g, h, B)
	fmt.Println("lookup table created", len(lookup))

	x0, x1 := searchLeft(lookup, p, g, B)

	fmt.Println("x0", x0)
	fmt.Println("x1", x1)

	fmt.Println("x", x0*B.Int64()+x1)
	fmt.Println(time.Now().Sub(start))
}

func bigIntToHex(bigint *big.Int) string {
	return hex.EncodeToString(bigint.Bytes())
}

func hexToBigInt(intHex string) *big.Int {
	bytes, _ := hex.DecodeString(intHex)
	result := big.NewInt(0)
	result.SetBytes(bytes)
	return result
}

func buildLeftLookup(p, g, h, B *big.Int) map[string]int64 {
	one := big.NewInt(1)

	x1 := big.NewInt(0)
	gix := big.NewInt(1)
	gi := big.NewInt(0)
	res := big.NewInt(0)

	lookup := make(map[string]int64)

	// create inverse of g...
	// we will take the power of this
	gi.ModInverse(g, p)

	for x1.Cmp(B) <= 0 {
		x1.Add(x1, one)

		// take power of g-inverse in p
		gix.Exp(gi, x1, p)

		// multiply gix by h
		res.Mul(gix, h)

		// put in zp
		res.Mod(res, p)

		hex := bigIntToHex(res)
		lookup[hex] = x1.Int64()

		//fmt.Println(hex)
	}

	return lookup
}

func searchLeft(lookup map[string]int64, p *big.Int, g *big.Int, B *big.Int) (int64, int64) {
	one := big.NewInt(1)
	x0 := big.NewInt(2)

	result := big.NewInt(0)

	for x0.Cmp(B) <= 0 {
		x0.Add(x0, one)
		//fmt.Println("x0    ", x0)

		result.Mul(x0, B)
		//fmt.Println("x0*B   ", result)

		result.Exp(g, result, p)
		//fmt.Println("g^B^x0", result)

		x1, ok := lookup[bigIntToHex(result)]
		if ok {
			return x0.Int64(), x1
		}
	}
	panic("failed to find value")
}
