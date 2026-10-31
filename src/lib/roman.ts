/**
 * Roman numerals, for the intro's counter, its year and its counts, and the
 * products' title cards.
 */

const NUMERALS: readonly (readonly [number, string])[] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
]

/**
 * A whole number from 1 to 3999 in Roman numerals (2026 is MMXXVI), the
 * subtractive forms included (4 is IV, 90 is XC). The Romans wrote no zero;
 * a counter that starts at nothing does, so 0 is a middle dot, "·". Anything
 * else (a fraction, a negative, 4000 and up, which would need a bar over the
 * letters) is a RangeError, not a guess.
 */
export function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 3999) throw new RangeError(`toRoman: ${n} is not a whole number from 0 to 3999`)
  if (n === 0) return '·'
  let rest = n
  let out = ''
  for (const [value, letters] of NUMERALS) {
    while (rest >= value) {
      out += letters
      rest -= value
    }
  }
  return out
}
