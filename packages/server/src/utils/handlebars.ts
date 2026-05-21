// @ts-ignore
import * as hbs from 'hbs'

const h = hbs as any

h.registerHelper('json', v1 => {
  // JSON.stringify(undefined) returns undefined, not "undefined";
  // calling .replace on it crashes the entire render. Treat as null.
  const s = JSON.stringify(v1)
  if (s === undefined) return 'null'
  return s
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
})
h.registerHelper('eq', (v1, v2) => v1 === v2)
h.registerHelper('ne', (v1, v2) => v1 !== v2)

export default h
