export function matchDatetime(pattern, dataStr) {
  return matchRegex(pattern, dataStr);
}

export function matchNumeric(pattern, dataStr) {
    return matchRegex(pattern, dataStr);
}

export function matchText(pattern, dataStr) {
  return matchRegex(pattern, dataStr);
}

export function matchRegex(pattern, dataStr) {
  if (!pattern) {
    return true;
  }
  return new RegExp(pattern).test(dataStr);
}

function matchBoolean(dataStr) {
  // Idealy only "true" and "false" would pass.
  return [
    "True",
    "true",
    "TRUE",
    "T",
    "1",
    "1.0",
    "False",
    "false",
    "FALSE",
    "F",
    "0",
    "0.0",
  ].includes(dataStr);
}

export function matchFormat(attrType, pattern, dataStr) {
  if (attrType.includes("DateTime")) {
    return matchDatetime(pattern, dataStr);
  } else if (attrType.includes("Numeric")) {
    return matchNumeric(pattern, dataStr);
  } else if (attrType.includes("Text")) {
    return matchText(pattern, dataStr);
  } else if (attrType.includes("Boolean")) {
    return matchBoolean(dataStr);
  } else {
    return true;
  }
}

function isValidUTF8(dataStr) {
  const decoder = new TextDecoder("utf-8");
  try {
    const uint8Array = new TextEncoder().encode(dataStr);
    decoder.decode(uint8Array);
    return true;
  } catch (error) {
    return false;
  }
}

function isValidUTF16LE(dataStr) {
  const decoder = new TextDecoder("utf-16le");
  try {
    const uint8Array = new TextEncoder().encode(dataStr);
    decoder.decode(uint8Array);
    return true;
  } catch (error) {
    return false;
  }
}

function isValidISO88591(dataStr) {
  const decoder = new TextDecoder("iso-8859-1");
  try {
    const buffer = new ArrayBuffer(dataStr.length);
    const uint8Array = new Uint8Array(buffer);
    for (let i = 0; i < dataStr.length; i++) {
      uint8Array[i] = dataStr.charCodeAt(i);
    }
    decoder.decode(buffer);
    return true;
  } catch (error) {
    return false;
  }
}

export function matchCharacterEncoding(dataStr, attrCharEncode) {
  if (attrCharEncode === "utf-8") {
    return isValidUTF8(dataStr);
  } else if (attrCharEncode === "utf-16le") {
    return isValidUTF16LE(dataStr);
  } else if (attrCharEncode === "iso-8859-1") {
    return isValidISO88591(dataStr);
  } else {
    return false;
  }
}