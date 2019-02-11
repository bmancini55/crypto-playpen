## Test 1: Factoring `|p−q| < 2N^1/4`

This is for factoring near primes by knowing that `A = (p*q)/2` which is roughly `sqrt(N)`

* First find `A` with `ceil(sqrt(N))`
* There is some `x` such that `N = p*q = (A-x)(A+x)`
* Solving for `x` via `sqrt(A^2 - N)`
* Recover `p = A-x`
* Recover `q = A+x`

```
go run test1/main.go -N 2491
go run test1/main.go -N 179769313486231590772930519078902473361797697894230657273430081157732675805505620686985379449212982959585501387537164015710139858647833778606925583497541085196591615128057575940752635007475935288710823649949940771895617054361149474865046711015101563940680527540071584560878577663743040086340742855278549092581
```

## Test 2: Factoring `|p−q| < 2^11*N^1/4`

This attemps to brute force the factorization when the values are close.

* First find `A` with `ceil(sqrt(N))`
* Iterate `A` and...
* Solve for `x` via `sqrt(A^2 - N)`
* Recover `p` and `q`
* Check ig `pq` = `N`

```
go run test2/main.go -N 648455842808071669662824265346772278726343720706976263060439070378797308618081116462714015276061417569195587321840254520655424906719892428844841839353281972988531310511738648965962582821502504990264452100885281673303711142296421027840289307657458645233683357077834689715838646088239640236866252211790085787877
```

## Test 3: Factoring `|3p−2q| < N^1/4`. Hint `sqrt(6N) is close to (3p + 2q) / 2`

This one sucked because `(3p+2q)/2` is odd. So we need to account for that by multiplying by 2.

```
go run test3/main.go -N 15
go run test3/main.go -N 720062263747350425279564435525583738338084451473999841826653057981916355690188337790423408664187663938485175264994017897083524079135686877441155132015188279331812309091996246361896836573643119174094961348524639707885238799396839230364676670221627018353299443241192173812729276147530748597302192751375739387929
```

## Test 4: Breaking RSA from factored numbers

* The code will first factor near primes as done in test 1.
* Once that is done, we can calculate `φ(N)` by knowning that `φ(N) = (p-1)(q-1) = N-p-q+1`
* With `φ(N)` we get the decryption key, since `e*d = 1 mod φ(N)` by finding `e^-1 mod φ(N)`
* With `d` we can recover `m` by `c^d mod φ(N)`
* Then the padding must stripped off by looking for `0x00`

```
go run test4/main.go -N 179769313486231590772930519078902473361797697894230657273430081157732675805505620686985379449212982959585501387537164015710139858647833778606925583497541085196591615128057575940752635007475935288710823649949940771895617054361149474865046711015101563940680527540071584560878577663743040086340742855278549092581 -e 65537 -c 22096451867410381776306561134883418017410069787892831071731839143676135600120538004282329650473509424343946219751512256465839967942889460764542040581564748988013734864120452325229320176487916666402997509188729971690526083222067771600019329260870009579993724077458967773697817571267229951148662959627934791540
```