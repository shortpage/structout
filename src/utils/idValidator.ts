/** Legal ID = (letters|digits) only, no underscores, digit can't start,
 *  and *does not* contain the pattern lower–Upper–lower … Upper
 *  (that's what tEstoBject triggers). */
export const isLegalId = (s: string): boolean =>
  /^[A-Za-z][A-Za-z0-9]*$/.test(s) && // basic charset rule
  !/[a-z][A-Z][a-z][A-Za-z]*[A-Z]/.test(s); // alternating-caps ban
