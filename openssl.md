```bash
# Creating secp256k1 private key in PEM format
openssl genpkey -genparam -algorithm EC -pkeyout ec_paramgen_curve:secp256k1 -out ecp.pem
openssl genpkey -paramfile ecp.pem -out ec.pem
```

```bash
# Creating secp256k1 private key in DER format
openssl genpkey -genparam -algorithm EC -pkeyout ec_paramgen_curve:secp256k1 -out ecp.pem
openssl genpkey -paramfile ecp.pem -outform DER -out ec.der
```

```bash
# Alternative form of creating EC params
openssl ecparam -genkey -name secp256k1
```

```bash
# Creating a public key from a private key
openssl pkey -in ec.pem -pubout -out ec.pub
```
