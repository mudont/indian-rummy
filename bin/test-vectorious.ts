import { array, NDArray, random } from 'vectorious'
import * as V from 'vectorious'

const a1 = random(4200, 4200)
const a2 = random(4200, 4200)
console.time('multiply')
const a3 = V.multiply(a1, a2)
console.timeEnd('multiply')
console.log(a3.shape)