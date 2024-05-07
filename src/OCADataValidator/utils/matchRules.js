// function matchDatetime (pattern, dataStr) {
//     // Converts the ISO 8601 format into JavaScript Date format.
//     function iso2js (isoStr) {
//         const isoConv = {
//             YYYY: 'YYYY',
//             MM: 'MM',
//             DDD: 'DDDD',
//             DD: 'DD',
//             D: 'd',
//             ww: 'WW',
//             '+hh:mm': 'Z',
//             '-hh:mm': 'Z',
//             '+hhmm': 'Z',
//             '-hhmm': 'Z',
//             Z: 'Z',
//             hh: 'HH',
//             mm: 'MM',
//             sss: 'SSS',
//             ss: 'SS'
//         };

//         let jsStr = isoStr;
//         for (const i in isoConv) {
//             jsStr = jsStr.replace(i, isoConv[i]);
//         }
//         return jsStr;
//     }

//     if (!pattern) {
//         return true;
//     }

//     if (pattern.includes('/')) {
//         // Time intervals: <start>/<end>, <start>/<duration>, or <duration>/<end>.
//         // Repeating intervals: R(n)/<interval>.
//         // In both cases, validates two parts separately.
//         if (!dataStr.includes('/')) {
//             return false;
//         } else {
//             return matchDatetime(pattern.split('/')[0], dataStr.split('/')[0]) && matchDatetime(pattern.split('/')[1], dataStr.split('/')[1]);
//         }
//     } else if (pattern[0] === 'P' || pattern[0] === 'R') {
//         // Durations or repeating interval heads.
//         // Match the string with n's replaced with actual numbers.
//         return matchRegex('^' + pattern.replace('n', '[0-9]+') + '$').test(dataStr);
//     } else {
//         pattern = iso2js(pattern);
//         try {
//             const date = new Date(dataStr);
//             if (isNaN(date.getTime())) {
//                 return false;
//             }
//         } catch (error) {
//             return false;
//         }
//         return true;
//     }
// };

function matchDatetime(pattern, dataStr) {
  return matchRegex(pattern, dataStr);
}

function matchNumeric(pattern, dataStr) {
  if (!pattern) {
    return !isNaN(dataStr);
  } else {
    return new RegExp(pattern).test(dataStr);
  }
}

function matchRegex(pattern, dataStr) {
  if (!pattern) {
    return true;
  }
  return new RegExp(pattern).test(dataStr);
};

function matchBoolean(dataStr) {
  // Idealy only "true" and "false" would pass.
  return [
    'True',
    'true',
    'TRUE',
    'T',
    '1',
    '1.0',
    'False',
    'false',
    'FALSE',
    'F',
    '0',
    '0.0'
  ].includes(dataStr);
};

export function matchFormat(attrType, pattern, dataStr) {
  if (attrType.includes('DateTime')) {
    return matchDatetime(pattern, dataStr);
  } else if (attrType.includes('Numeric')) {
    return matchNumeric(pattern, dataStr);
  } else if (attrType.includes('Text')) {
    return matchRegex(pattern, dataStr);
  } else if (attrType.includes('Boolean')) {
    return matchBoolean(dataStr);
  } else {
    return true;
  }
};

function isValidUTF8(dataStr) {
  const decoder = new TextDecoder('utf-8');
  try {
    const uint8Array = new TextEncoder().encode(dataStr);
    decoder.decode(uint8Array);
    return true;
  } catch (error) {
    return false;
  }
};

function isValidUTF16LE(dataStr) {
  const decoder = new TextDecoder('utf-16le');
  try {
    const uint8Array = new TextEncoder().encode(dataStr);
    decoder.decode(uint8Array);
    return true;
  } catch (error) {
    return false;
  }
};

function isValidISO88591(dataStr) {
  const decoder = new TextDecoder('iso-8859-1');
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
};

export function matchCharacterEncoding(dataStr, attrCharEncode) {
  if (attrCharEncode === 'utf-8') {
    return isValidUTF8(dataStr);
  } else if (attrCharEncode === 'utf-16le') {
    return isValidUTF16LE(dataStr);
  } else if (attrCharEncode === 'iso-8859-1') {
    return isValidISO88591(dataStr);
  } else {
    return false;
  }
};