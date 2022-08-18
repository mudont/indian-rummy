const badRec = (n: number): number => {
    return badRec(n + 1)
}

console.log(`${badRec(0)}`)