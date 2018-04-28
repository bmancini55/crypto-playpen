package main

import (
	"encoding/hex"
	"flag"
	"fmt"
	"math/big"
)

func main() {
	Nstr := flag.String("N", "", "N")
	estr := flag.String("e", "", "e")
	cstr := flag.String("c", "", "e")
	flag.Parse()

	// N
	N := new(big.Int)
	N.SetString(*Nstr, 10)
	fmt.Println("N:   ", N)

	// e
	e := new(big.Int)
	e.SetString(*estr, 10)
	fmt.Println("e:   ", e)

	// c
	c := new(big.Int)
	c.SetString(*cstr, 10)
	fmt.Println("c:   ", c)

	// factor the prime n according to test1 factoring technique
	p, q := factor(N)
	fmt.Println("p:   ", p)
	fmt.Println("q:   ", q)

	// calculate phi(n) based on pq
	// phi(n) = (p-1)(q-1) = N-p-q+1
	phi := new(big.Int)
	phi.Sub(N, p)
	phi.Sub(phi, q)
	phi.Add(phi, big.NewInt(1))
	fmt.Println("phi: ", phi)

	// get d from modinverse of e in phi(n)
	// d = e^-1 in phi(n)
	d := new(big.Int)
	d.ModInverse(e, phi)
	fmt.Println("d:  ", d)

	// get m
	m := new(big.Int)
	m.Exp(c, d, N)
	fmt.Println("m:  ", m)

	// get m bytes
	mb := m.Bytes()
	fmt.Println("m:  ", hex.EncodeToString(mb))

	if mb[0] != 0x02 {
		panic("mb is not pkcs v1.5 encoded, must start with 0x02")
	}

	result := stripPadding(mb)
	fmt.Println("\n\nresult:", string(result))
}

func factor(N *big.Int) (p *big.Int, q *big.Int) {
	A := new(big.Int)
	A.Sqrt(N)
	A.Add(A, big.NewInt(1))

	x := new(big.Int)
	x.Mul(A, A)
	x.Sub(x, N)
	x.Sqrt(x)

	p = new(big.Int)
	p.Sub(A, x)

	q = new(big.Int)
	q.Add(A, x)

	return
}

func stripPadding(m []byte) []byte {
	for i, b := range m {
		if b == 0x00 {
			return m[i:]
		}
	}
	return make([]byte, 0)
}
