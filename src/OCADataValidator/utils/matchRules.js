function matchDatetime (pattern, dataStr) {
    // Converts the ISO 8601 format into JavaScript Date format.
    function iso2js (isoStr) {
        const isoConv = {
            YYYY: 'YYYY',
            MM: 'MM',
            DDD: 'DDDD',
            DD: 'DD',
            D: 'd',
            ww: 'WW',
            '+hh:mm': 'Z',
            '-hh:mm': 'Z',
            '+hhmm': 'Z',
            '-hhmm': 'Z',
            Z: 'Z',
            hh: 'HH',
            mm: 'MM',
            sss: 'SSS',
            ss: 'SS'
        };

        let jsStr = isoStr;
        for (const i in isoConv) {
            jsStr = jsStr.replace(i, isoConv[i]);
        }
        return jsStr;
    }

    if (!pattern) {
        return true;
    }

    if (pattern.includes('/')) {
        // Time intervals: <start>/<end>, <start>/<duration>, or <duration>/<end>.
        // Repeating intervals: R(n)/<interval>.
        // In both cases, validates two parts separately.
        if (!dataStr.includes('/')) {
            return false;
        } else {
            return matchDatetime(pattern.split('/')[0], dataStr.split('/')[0]) && matchDatetime(pattern.split('/')[1], dataStr.split('/')[1]);
        }
    } else if (pattern[0] === 'P' || pattern[0] === 'R') {
        // Durations or repeating interval heads.
        // Match the string with n's replaced with actual numbers.
        return matchRegex('^' + pattern.replace('n', '[0-9]+') + '$').test(dataStr);
    } else {
        pattern = iso2js(pattern);
        try {
            // JavaScript Date format matching.
            // If formats are not matched, an exception will be raised.
            const date = new Date(dataStr);
            if (isNaN(date.getTime())) {
                return false;
            }
        } catch (error) {
            return false;
        }
        return true;
    }
};

function matchRegex (pattern, dataStr) {
    if (!pattern) {
        return true;
    }
    // Regular expression matching with RegExp.test().
    return new RegExp(pattern).test(dataStr);
};

function matchBoolean (dataStr) {
    // Idealy only "true" and "false" would pass.
    return dataStr in [
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
    ];
};

export function matchFormat (attrType, pattern, dataStr) {
    if (attrType.includes('DateTime')) {
        return matchDatetime(pattern, dataStr);
    } else if (attrType.includes('Numeric') || attrType.includes('Text')) {
        return matchRegex(pattern, dataStr);
    } else if (attrType.includes('Boolean')) {
        return matchBoolean(dataStr);
    } else {
        return true;
    }
};
