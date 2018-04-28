package main

import (
	"flag"
	"fmt"
	"math/big"
)

func main() {
	Nstr := flag.String("N", "", "N")
	flag.Parse()

	N := new(big.Int)
	N.SetString(*Nstr, 10)
	fmt.Println("N:   ", N)

	N24 := new(big.Int)
	N24.Mul(N, big.NewInt(24))

	A := new(big.Int)
	A.Sqrt(N24)
	A.Add(A, big.NewInt(1))
	fmt.Println("A:   ", A)

	x := new(big.Int)
	x.Mul(A, A)
	x.Sub(x, N24)
	x.Sqrt(x)
	fmt.Println("x:   ", x)

	p := new(big.Int)
	p.Sub(A, x)
	p.Div(p, big.NewInt(6))
	fmt.Println("p:   ", p)

	q := new(big.Int)
	q.Add(A, x)
	q.Div(q, big.NewInt(4))
	fmt.Println("q:   ", q)

	// validate
	pq := new(big.Int)
	pq.Mul(p, q)
	fmt.Println("p*q: ", pq)
}
