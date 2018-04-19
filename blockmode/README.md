# AES Block Modes

## CBC

CBC mode (requires an random IV which is NOT shown):

```
go run *.go -encrypt -blockmode CBC -key 36f18357be4dbd77f050515c73fcf9f2 -plaintext 'Hello world!' -iv 00000000000000000000000000000000
```

```
go run *.go -decrypt -blockmode CBC -key 36f18357be4dbd77f050515c73fcf9f2 -cipher 00000000000000000000000000000000e2fd11e963c2428dd51e3f9c351f53a6
```

##CTR

CTR mode without an IV:

```
go run *.go -encrypt -blockmode CTR -key 36f18357be4dbd77f050515c73fcf9f2 -plaintext 'Hello world!'
```

```
go run *.go -decrypt -blockmode CTR -key 36f18357be4dbd77f050515c73fcf9f2 -cipher 000000000000000000000000000000000e5e8f98fb011bc1f317e005
```

CTR mode with a supplied IV:

```
go run *.go -encrypt -blockmode CTR -key 36f18357be4dbd77f050515c73fcf9f2 -plaintext 'Hello world!' -iv 770b80259ec33beb2561358a9f2dc617
```

```
go run *.go -decrypt -blockmode CTR -key 36f18357be4dbd77f050515c73fcf9f2 -cipher 770b80259ec33beb2561358a9f2dc617ed6b03cdb36fe9c46d59e91a
```
