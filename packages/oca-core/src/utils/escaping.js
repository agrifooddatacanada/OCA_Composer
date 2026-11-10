/**
 * Strips generic string escaping.
 * WARNING: DO NOT use this on Format Rules or regular expressions.
 * It will strip backslashes (e.g., \- becomes -) and corrupt the regex.
 */
export const normalizeEscapedQuotes = (s) => {
  if (typeof s !== "string") return s;
  return (
    s
      .replace(/\\-/g, "-")
      .replace(/\\'/g, "'")
      // eslint-disable-next-line quotes
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
  );
};

export const escapeForOCAString = (s) => {
  if (typeof s !== "string") return s;
  // First escape backslashes, then escape double quotes, single quotes, and dashes for OCA output
  return (
    String(s)
      .replace(/\\/g, "\\\\")
      // eslint-disable-next-line quotes
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/-/g, "\\-")
  );
};

export const escapeForOCADoubleQuotedValue = (s) => {
  if (typeof s !== "string") return s;
  // eslint-disable-next-line quotes
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
};

/**
 * Safely escapes double quotes for OCA export while preserving regex-specific backslashes.
 * Format rules are often regular expressions, so we CANNOT use `escapeForOCAString`
 * or `normalizeEscapedQuotes` which would destroy regex escapes like \- or \d.
 */
export const escapeFormatRuleForOCA = (formatRule) => {
  if (typeof formatRule !== "string") return formatRule;
  // eslint-disable-next-line quotes
  return formatRule.replace(/\\"/g, '"').replace(/"/g, '\\"');
};
