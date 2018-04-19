# Discrete Log

This program will compute the discrete log modulo a prime `p`.

Let `g` be some element in `Zp∗`. You are given `h` in `Zp*` such that `h = g^x` where `1 <= x <=
2^40`. We need to find `x`.

We will use a meet in the middle attack to reduce `2^40` to `2^20`.

Let `B = 2^20`.

`x base B` can be written as `x0 * B + x1` where `x0, x1` are in the range `[0, B-1]`.

This can be rewritten as:

```
h = g^x in Zp
h = g^(x0 * B + x1) in Zp
h = (g^B)^x0 * g^x1 in Zp
```

Which can then be:

```
h/g^x1 = (g^B)^x0 in Zp
```

This creates the two sides, of which we can solve for and try to find equivalence!

```
# Simple test
go run main.go \
-p 1073676287 \
-g 1010343267 \
-h 857348958 \
-B 1024

# Results (meet-in-the-middle with value 658308031)
> x0 1002
> x1 783
> x 1026831
```

```
# Harder test
go run main.go \
-p 13407807929942597099574024998205846127479365820592393377723561443721764030073546976801874298166903427690031858186486050853753882811946569946433649006084171 \
-g 11717829880366207009516117596335367088558084999998952205599979459063929499736583746670572176471460312928594829675428279466566527115212748467589894601965568 \
-h 3239475104050450443565264378728065788649097520952449527834792452971981976143292558073856937958553180532878928001494706097394108577585732452307673444020333 \
-B 1048576
```
