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

	// A is the average of N
	// A = ceil(sqrt(N)
	A := new(big.Int)
	A.Sqrt(N)
	A.Add(A, big.NewInt(1))
	fmt.Println("A:   ", A)

	// N = p*q = (A-x)(A+x)
	// solve for x:
	// x = sqrt(A^2 - N)
	x := new(big.Int)
	x.Mul(A, A)
	x.Sub(x, N)
	x.Sqrt(x)
	fmt.Println("x:   ", x)

	// p = A-x
	p := new(big.Int)
	p.Sub(A, x)
	fmt.Println("p:   ", p)

	// q = A+x
	q := new(big.Int)
	q.Add(A, x)
	fmt.Println("q:   ", q)

	// validate
	pq := new(big.Int)
	pq.Mul(p, q)
	fmt.Println("p*q: ", pq)
}
