import { camelCase } from "change-case";

/**
 * Normalises user text and returns true camelCase.
 * 1. strips non-alphanum         → word boundaries
 * 2. lower-cases the whole thing → kills weird caps like tEst
 * 3. feeds result to change-case
 */
export const toCamel = (raw: string): string =>
  camelCase(
    raw
      .replace(/[^A-Za-z0-9]+/g, " ") // separate junk with spaces
      .toLowerCase(),
  );
