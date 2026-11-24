/**
 * Decode CSV/TSV bytes: UTF-8 BOM / UTF-16 LE / UTF-16 BE, then strict UTF-8 or legacy ANSI.
 * - Papa strips UTF-8 BOM only for string input, not File streaming.
 * - UTF-16 exports must not be read as UTF-8.
 * - Excel "ANSI" / Windows-1252 uses byte 0xB0 for °; that byte is invalid UTF-8 alone, so
 *   default TextDecoder replaces it with U+FFFD (�). We use fatal UTF-8 and fall back to
 *   windows-1252 when the file is not valid UTF-8.
 */
function decodeWindows1252OrLatin1(buf) {
  try {
    return new TextDecoder("windows-1252").decode(buf);
  } catch {
    return new TextDecoder("iso-8859-1").decode(buf);
  }
}

export function decodeBytesToString(buf) {
  if (buf.length === 0) {
    return "";
  }
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(buf.slice(3));
    } catch {
      return decodeWindows1252OrLatin1(buf.slice(3));
    }
  }
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(buf.slice(2));
  }
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(buf.slice(2));
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return decodeWindows1252OrLatin1(buf);
  }
}

/**
 * UTF-8 C2 A1 is ¡ (U+00A1); C2 B0 is ° (U+00B0). Some TSV/CSV exports mis-encode the degree
 * sign as ¡. CP1252 byte 0xA1 is also ¡ vs 0xB0 for °. Replace ¡ with ° only when a digit
 * precedes ¡ (e.g. 45¡30, -12.5¡) so leading Spanish ¡ is not touched.
 */
export function normalizeInvertedExclamationAsDegree(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (/\d\s*\u00A1/.test(value)) {
    return value.replace(/\u00A1/g, "\u00B0");
  }
  return value;
}
