package main

import (
	"flag"
	"fmt"
	"math/big"
)

func main() {
	Nstr := flag.String("N", "", "N")
	flag.Parse()

	// N
	N := new(big.Int)
	N.SetString(*Nstr, 10)
	fmt.Println("N:   ", N)

	// A
	A := new(big.Int)
	A.Sqrt(N)
	fmt.Println("A:   ", A)

	// iterate till we have a factor
	one := big.NewInt(1)
	p := new(big.Int)
	q := new(big.Int)
	pq := new(big.Int)

	for {
		A.Add(A, one)
		x := findX(A, N)

		p.Sub(A, x)
		q.Add(A, x)

		pq.Mul(p, q)
		if pq.Cmp(N) == 0 {
			fmt.Println("p:   ", p)
			fmt.Println("q:   ", q)
			fmt.Println("p*q: ", pq)
			break
		}
	}
}

func findX(A, N *big.Int) *big.Int {
	x := new(big.Int)
	x.Mul(A, A)
	x.Sub(x, N)
	x.Sqrt(x)
	return x
}
