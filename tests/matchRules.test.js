import { matchRegex } from '../src/OCADataValidator/utils/matchRules';

test('matchRegex (ISO: YYYY-MM-DD: year month day)', () => {
    const pattern = "^(?:(?:19|20)\\d{2})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2]\\d|3[0-1])$";
    const badPattern_1 = "^(?:(?:19|20)\\d{2})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2]\\d|3[0-1])$/g";
    const badPattern_2 = "^(?:(?:19|20)\\d{2})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2]\\d|3[0-1])$/gm";

    const testDate = [
        '1900-01-01',
        '1900-12-31',
        '2000-01-01',
        '2000-12-31',
        '2021-01-01',
        '2021-12-31',
        '2021-02-28',
        '2021-02-29',
        '2021-03-31',
        '2021-04-30',
        '2021-05-31',
        '2021-06-30',
        '2021-07-31',
        '2021-08-31',
        '2021-09-30',
        '2021-10-31',
        '2021-11-30',
        '2021-12-31'
    ];

    testDate.forEach(date => {
        expect(matchRegex(pattern, date)).toBeTruthy();
    });

    testDate.forEach(date => {
        expect(matchRegex(badPattern_1, date)).toBeFalsy();
    });

    testDate.forEach(date => {
        expect(matchRegex(badPattern_2, date)).toBeFalsy();
    });

});

test('matchRegex (ISO: YYYYMMDD: year month day)', () => {
    const pattern = "^(?:(?:19|20)\\d{2})(?:0[1-9]|1[0-2])(?:0[1-9]|[1-2]\\d|3[0-1])$";
    const badPattern_1 = "^(?:(?:19|20)\\d{2})(?:0[1-9]|1[0-2])(?:0[1-9]|[1-2]\\d|3[0-1])$/g";
    const badPattern_2 = "^(?:(?:19|20)\\d{2})(?:0[1-9]|1[0-2])(?:0[1-9]|[1-2]\\d|3[0-1])$/gm";

    const testDate = [
        '19000101',
        '19001231',
        '20000101',
        '20001231',
        '20210101',
        '20211231',
        '20210228',
        '20210229',
        '20210331',
        '20210430',
        '20210531',
        '20210630',
        '20210731',
        '20210831',
        '20210930',
        '20211031',
        '20211130',
        '20211231'
    ];

    testDate.forEach(date => {
        expect(matchRegex(pattern, date)).toBeTruthy();
    });

    testDate.forEach(date => {
        expect(matchRegex(badPattern_1, date)).toBeFalsy();
    });

    testDate.forEach(date => {
        expect(matchRegex(badPattern_2, date)).toBeFalsy();
    });
});

test('matchRegex (ISO: YYYY-MM: year month)', () => {
    const pattern = "^(?:(?:19|20)\\d{2})-(?:0[1-9]|1[0-2])$";
    const badPattern_1 = "^(?:(?:19|20)\\d{2})-(?:0[1-9]|1[0-2])$/g";
    const badPattern_2 = "^(?:(?:19|20)\\d{2})-(?:0[1-9]|1[0-2])$/gm";

    const testYearMonth = [
        '1900-01', '1900-12', '2000-01', '2000-12', '2021-01', '2021-12'
    ];

    testYearMonth.forEach(yearMonth => {
        expect(matchRegex(pattern, yearMonth)).toBeTruthy();
    });

    testYearMonth.forEach(yearMonth => {
        expect(matchRegex(badPattern_1, yearMonth)).toBeFalsy();
    });

    testYearMonth.forEach(yearMonth => {
        expect(matchRegex(badPattern_2, yearMonth)).toBeFalsy();
    });
});

test('matchRegex (ISO: YYYY-Www: year week (e.g. W01)', () => {
    const pattern = "^(?:(?:19|20)\\d{2})-W(?:0[1-9]|[1-4][0-9]|5[0-3])$";
    const badPattern_1 = "^(?:(?:19|20)\\d{2})-W(?:0[1-9]|[1-4][0-9]|5[0-3])$/g";
    const badPattern_2 = "^(?:(?:19|20)\\d{2})-W(?:0[1-9]|[1-4][0-9]|5[0-3])$/gm";

    const testYearWeek = [
        '1900-W01', '1900-W52', '2000-W01', '2000-W52', '2021-W01', '2021-W53'
    ];

    testYearWeek.forEach(yearWeek => {
        expect(matchRegex(pattern, yearWeek)).toBeTruthy();
    });

    testYearWeek.forEach(yearWeek => {
        expect(matchRegex(badPattern_1, yearWeek)).toBeFalsy();
    });

    testYearWeek.forEach(yearWeek => {
        expect(matchRegex(badPattern_2, yearWeek)).toBeFalsy();
    });
});

test('matchRegex (ISO: YYYYWww: year week (e.g. W01))', () => {
    const pattern = "^(?:(?:19|20)\\d{2})W(?:0[1-9]|[1-4][0-9]|5[0-3])$";
    const badPattern_1 = "^(?:(?:19|20)\\d{2})W(?:0[1-9]|[1-4][0-9]|5[0-3])$/g";
    const badPattern_2 = "^(?:(?:19|20)\\d{2})W(?:0[1-9]|[1-4][0-9]|5[0-3])$/gm";

    const testYearWeek = [
        '1900W01', '1900W52', '2000W01', '2000W52', '2021W01', '2021W53'
    ];

    testYearWeek.forEach(yearWeek => {
        expect(matchRegex(pattern, yearWeek)).toBeTruthy();
    });

    testYearWeek.forEach(yearWeek => {
        expect(matchRegex(badPattern_1, yearWeek)).toBeFalsy();
    });

    testYearWeek.forEach(yearWeek => {
        expect(matchRegex(badPattern_2, yearWeek)).toBeFalsy();
    });
});

test('matchRegex (ISO: YYYY-DDD: Ordinal date (day number from the year))', () => {
    const pattern = "^(19[0-9]{2}|2[0-9]{3})-(00[1-9]|0[1-9][0-9]|[1-2][0-9]{2}|3[0-5][0-9]|36[0-6])$";
    const badPattern_1 = "^(19[0-9]{2}|2[0-9]{3})-(00[1-9]|0[1-9][0-9]|[1-2][0-9]{2}|3[0-5][0-9]|36[0-6])$/g";
    const badPattern_2 = "^(19[0-9]{2}|2[0-9]{3})-(00[1-9]|0[1-9][0-9]|[1-2][0-9]{2}|3[0-5][0-9]|36[0-6])$/gm";

    const testOrdinalDate = [
        '1900-001', '1900-365', '2000-001', '2000-366', '2021-001', '2021-365'
    ];

    testOrdinalDate.forEach(ordinalDate => {
        expect(matchRegex(pattern, ordinalDate)).toBeTruthy();
    });

    testOrdinalDate.forEach(ordinalDate => {
        expect(matchRegex(badPattern_1, ordinalDate)).toBeFalsy();
    });

    testOrdinalDate.forEach(ordinalDate => {
        expect(matchRegex(badPattern_2, ordinalDate)).toBeFalsy();
    });
});

test('matchRegex (ISO: YYYYDDD: Ordinal date (day number from the year)', () => {
    const pattern = "^(19[0-9]{2}|2[0-9]{3})(00[1-9]|0[1-9][0-9]|[1-2][0-9]{2}|3[0-5][0-9]|36[0-6])$";
    const badPattern_1 = "^(19[0-9]{2}|2[0-9]{3})(00[1-9]|0[1-9][0-9]|[1-2][0-9]{2}|3[0-5][0-9]|36[0-6])$/g";
    const badPattern_2 = "^(19[0-9]{2}|2[0-9]{3})(00[1-9]|0[1-9][0-9]|[1-2][0-9]{2}|3[0-5][0-9]|36[0-6])$/gm";

    const testOrdinalDate = [
        '1900001', '1900365', '2000001', '2000366', '2021001', '2021365'
    ];

    testOrdinalDate.forEach(ordinalDate => {
        expect(matchRegex(pattern, ordinalDate)).toBeTruthy();
    });

    testOrdinalDate.forEach(ordinalDate => {
        expect(matchRegex(badPattern_1, ordinalDate)).toBeFalsy();
    });

    testOrdinalDate.forEach(ordinalDate => {
        expect(matchRegex(badPattern_2, ordinalDate)).toBeFalsy();
    });
});

test ('matchRegex (ISO: YYYY: year)', () => {
    const pattern = "^(?:19|20)\\d{2}$";
    const badPattern_1 = "^(?:19|20)\\d{2}$/g";
    const badPattern_2 = "^(?:19|20)\\d{2}$/gm";

    const testYear = [
        '1900', '2000', '2021'
    ];

    testYear.forEach(year => {
        expect(matchRegex(pattern, year)).toBeTruthy();
    });

    testYear.forEach(year => {
        expect(matchRegex(badPattern_1, year)).toBeFalsy();
    });

    testYear.forEach(year => {
        expect(matchRegex(badPattern_2, year)).toBeFalsy();
    });
});


test('matchRegex-month (ISO: MM: month)', () => {
    const pattern = "^(0[1-9]|1[0-2])$";
    const badPattern_1 = "^(0[1-9]|1[0-2])$/g";
    const badPattern_2 = "^(0[1-9]|1[0-2])$/gm";

    const testMonth = [
        '01', '12', '06', '07', '08', '09', '10', '11'
    ];

    testMonth.forEach(month => {
        expect(matchRegex(pattern, month)).toBeTruthy();
    });

    testMonth.forEach(month => {
        expect(matchRegex(badPattern_1, month)).toBeFalsy();
    });

    testMonth.forEach(month => {
        expect(matchRegex(badPattern_2, month)).toBeFalsy();
    });
});


test('matchRegex (ISO: DD: day)', () => {
    const pattern = "^(0[1-9]|[1-2][0-9]|3[01])$";
    const badPattern_1 = "^(0[1-9]|[1-2][0-9]|3[01])$/g";
    const badPattern_2 = "^(0[1-9]|[1-2][0-9]|3[01])$/gm";

    const testDay = [
        '01', '31', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'
    ];

    testDay.forEach(day => {
        expect(matchRegex(pattern, day)).toBeTruthy();
    });

    testDay.forEach(day => {
        expect(matchRegex(badPattern_1, day)).toBeFalsy();
    });

    testDay.forEach(day => {
        expect(matchRegex(badPattern_2, day)).toBeFalsy();
    });
});



test('matchRegex-DateTime (ISO: YYYY-MM-DDTHH:MM:SSZ: Date and Time Combined (UTC))', () => {
    const pattern = "^(?:\\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[01])T(?:[01][0-9]|2[0-3]):(?:[0-5][0-9]):(?:[0-5][0-9])Z$";
    const badPattern_1 = "^(?:\\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[01])T(?:[01][0-9]|2[0-3]):(?:[0-5][0-9]):(?:[0-5][0-9])Z$/g";
    const badPattern_2 = "^(?:\\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[01])T(?:[01][0-9]|2[0-3]):(?:[0-5][0-9]):(?:[0-5][0-9])Z$/gm";

    const testDateTime = [
        '1900-01-01T00:00:00Z', '1900-12-31T23:59:59Z', '2000-01-01T00:00:00Z', '2000-12-31T23:59:59Z', '2021-01-01T00:00:00Z', '2021-12-31T23:59:59Z'
    ];

    testDateTime.forEach(dateTime => {
        expect(matchRegex(pattern, dateTime)).toBeTruthy();
    });

    testDateTime.forEach(dateTime => {
        expect(matchRegex(badPattern_1, dateTime)).toBeFalsy();
    });

    testDateTime.forEach(dateTime => {
        expect(matchRegex(badPattern_2, dateTime)).toBeFalsy();
    });
});

test('matchRegex-DateTime (ISO: YYYY-MM-DDTHH:MM:SS±hh:mm: Date and Time Combined (with Timezone Offset))', () => {
    const pattern = "^(?:\\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[01])T(?:[01][0-9]|2[0-3]):(?:[0-5][0-9]):(?:[0-5][0-9])(?:[+-](?:0[0-9]|1[0-4]):[0-5][0-9])$";
    const badPattern_1 = "^(?:\\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[01])T(?:[01][0-9]|2[0-3]):(?:[0-5][0-9]):(?:[0-5][0-9])(?:[+-](?:0[0-9]|1[0-4]):[0-5][0-9])$/g";
    const badPattern_2 = "^(?:\\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[01])T(?:[01][0-9]|2[0-3]):(?:[0-5][0-9]):(?:[0-5][0-9])(?:[+-](?:0[0-9]|1[0-4]):[0-5][0-9])$/gm";

    const testDateTime = [
        '1900-01-01T00:00:00+00:00', '1900-12-31T23:59:59+00:00', '2000-01-01T00:00:00+00:00', '2000-12-31T23:59:59+00:00', '2021-01-01T00:00:00+00:00', '2021-12-31T23:59:59+00:00'
    ];

    testDateTime.forEach(dateTime => {
        expect(matchRegex(pattern, dateTime)).toBeTruthy();
    });

    testDateTime.forEach(dateTime => {
        expect(matchRegex(badPattern_1, dateTime)).toBeFalsy();
    });

    testDateTime.forEach(dateTime => {
        expect(matchRegex(badPattern_2, dateTime)).toBeFalsy();
    });
});

test('matchRegex-duration (ISO: PnYnMnDTnHnMnS :durations e.g. P3Y6M4DT12H30M5S)', () => {
    const pattern = "^P(?!$)((\\d+Y)|(\\d+\\.\\d+Y))?((\\d+M)|(\\d+\\.\\d+M))?((\\d+W)|(\\d+\\.\\d+W))?((\\d+D)|(\\d+\\.\\d+D))?(T(?=\\d)((\\d+H)|(\\d+\\.\\d+H))?((\\d+M)|(\\d+\\.\\d+M))?(\\d+(\\.\\d+)?S)?)?$";
    const badPattern_1 = "^P(?!$)((\\d+Y)|(\\d+\\.\\d+Y))?((\\d+M)|(\\d+\\.\\d+M))?((\\d+W)|(\\d+\\.\\d+W))?((\\d+D)|(\\d+\\.\\d+D))?(T(?=\\d)((\\d+H)|(\\d+\\.\\d+H))?((\\d+M)|(\\d+\\.\\d+M))?(\\d+(\\.\\d+)?S)?)?$/g";
    const badPattern_2 = "^P(?!$)((\\d+Y)|(\\d+\\.\\d+Y))?((\\d+M)|(\\d+\\.\\d+M))?((\\d+W)|(\\d+\\.\\d+W))?((\\d+D)|(\\d+\\.\\d+D))?(T(?=\\d)((\\d+H)|(\\d+\\.\\d+H))?((\\d+M)|(\\d+\\.\\d+M))?(\\d+(\\.\\d+)?S)?)?$/gm";

    const testDuration = [
        'P3M',
        'P4W',
        'P10D',
        'P2Y6M',
        'P1Y2M3W4D',
        'PT5H',
        'PT30M',
        'PT45S',
        'P1DT12H',
        'P2DT3H4M5S',
        'P1Y2M3DT4H5M6S'
        ];
    
    testDuration.forEach(duration => {
        expect(matchRegex(pattern, duration)).toBeTruthy();
    });

    testDuration.forEach(duration => {
        expect(matchRegex(badPattern_1, duration)).toBeFalsy();
    });

    testDuration.forEach(duration => {
        expect(matchRegex(badPattern_2, duration)).toBeFalsy();
    });
});

test ('matchRegex-Time (ISO: HH:MM: hour, minutes in 24 hour notation)', () => {
    const pattern = "^([01][0-9]|2[0-3]):[0-5][0-9]$";
    const badPattern_1 = "^([01][0-9]|2[0-3]):[0-5][0-9]$/g";
    const badPattern_2 = "^([01][0-9]|2[0-3]):[0-5][0-9]$/gm";

    const testHourMinute = [
        '00:00',
        '12:30',
        '21:59',
        '09:15',
        '20:50',
        '21:10',
      ];

    testHourMinute.forEach(time => {
        expect(matchRegex(pattern, time)).toBeTruthy();
    });

    testHourMinute.forEach(time => {
        expect(matchRegex(badPattern_1, time)).toBeFalsy();
    });

    testHourMinute.forEach(time => {
        expect(matchRegex(badPattern_2, time)).toBeFalsy();
    });
});

test('matchRegex-Time ("ISO: HH:MM:SS: hour, minutes, seconds in 24 hour notation")', () => {
    const pattern = "^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$";
    const badPattern_1 = "^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/g";
    const badPattern_2 = "^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/gm";

    const testHourMinuteSecond = [
        '00:00:00', '12:30:00', '21:59:00', '09:15:00', '20:50:00', '21:10:00'
      ];

    testHourMinuteSecond.forEach(time => {
        expect(matchRegex(pattern, time)).toBeTruthy();
    });

    testHourMinuteSecond.forEach(time => {
        expect(matchRegex(badPattern_1, time)).toBeFalsy();
    });

    testHourMinuteSecond.forEach(time => {
        expect(matchRegex(badPattern_2, time)).toBeFalsy();
    });
});

test('matchRegex (DD/MM/YYYY: day, month, year)', () => {
    const pattern = "^(0[1-9]|[12][0-9]|3[01])\\/(0[1-9]|1[0-2])\\/(19|20)\\d{2}$";
    const badPattern_1 = "^(0[1-9]|[12][0-9]|3[01])\\/(0[1-9]|1[0-2])\\/(19|20)\\d{2}$/g";
    const badPattern_2 = "^(0[1-9]|[12][0-9]|3[01])\\/(0[1-9]|1[0-2])\\/(19|20)\\d{2}$/gm";

    const testDayMonthYear = [
        '01/01/1900', '31/12/1900', '01/01/2000', '31/12/2000', '01/01/2021', '31/12/2021'
    ];

    testDayMonthYear.forEach(date => {
        expect(matchRegex(pattern, date)).toBeTruthy();
    });

    testDayMonthYear.forEach(date => {
        expect(matchRegex(badPattern_1, date)).toBeFalsy();
    });

    testDayMonthYear.forEach(date => {
        expect(matchRegex(badPattern_2, date)).toBeFalsy();
    });
});

test('matchRegex (MM/DD/YYYY: month, day, year)', () => {
    const pattern = "^(0[1-9]|1[0-2])\\/(0[1-9]|[12][0-9]|3[01])\\/(19|20)\\d{2}$";
    const badPattern_1 = "^(0[1-9]|1[0-2])\\/(0[1-9]|[12][0-9]|3[01])\\/(19|20)\\d{2}$/g";
    const badPattern_2 = "^(0[1-9]|1[0-2])\\/(0[1-9]|[12][0-9]|3[01])\\/(19|20)\\d{2}$/gm";

    const testMonthDayYear = [
        '01/01/1900', '12/31/1900', '01/01/2000', '12/31/2000', '01/01/2021', '12/31/2021'
    ];

    testMonthDayYear.forEach(date => {
        expect(matchRegex(pattern, date)).toBeTruthy();
    });

    testMonthDayYear.forEach(date => {
        expect(matchRegex(badPattern_1, date)).toBeFalsy();
    });

    testMonthDayYear.forEach(date => {
        expect(matchRegex(badPattern_2, date)).toBeFalsy();
    });
});

test('matchRegex (DDMMYYYY: day, month, year)', () => {
    const pattern = "^(0[1-9]|[12]\\d|3[01])(0[1-9]|1[0-2])(19|20)\\d{2}$";
    const badPattern_1 = "^(0[1-9]|[12]\\d|3[01])(0[1-9]|1[0-2])(19|20)\\d{2}$/g";
    const badPattern_2 = "^(0[1-9]|[12]\\d|3[01])(0[1-9]|1[0-2])(19|20)\\d{2}$/gm";

    const testDayMonthYear = [
        '01011900', '31121900', '01012000', '31122000', '01012021', '31122021'
    ];

    testDayMonthYear.forEach(date => {
        expect(matchRegex(pattern, date)).toBeTruthy();
    });

    testDayMonthYear.forEach(date => {
        expect(matchRegex(badPattern_1, date)).toBeFalsy();
    });

    testDayMonthYear.forEach(date => {
        expect(matchRegex(badPattern_2, date)).toBeFalsy();
    });
});


test('matchRegex (MMDDYYYY: month, day, year)', () => {
    const pattern = "^0?[1-9]|1[0-2](0[1-9]|[12]\d|3[01])(19|20)\d{2}$";
    const badPattern_1 = "^(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])(19|20)\\d{2}$/g";
    const badPattern_2 = "^(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])(19|20)\\d{2}$/gm";

    const testMonthDayYear = [
        '01011900', '31121900', '01012000', '31122000', '01012021', '31122021'
    ];

    testMonthDayYear.forEach(date => {
        expect(matchRegex(pattern, date)).toBeTruthy();
    });

    testMonthDayYear.forEach(date => {
        expect(matchRegex(badPattern_1, date)).toBeFalsy();
    });

    testMonthDayYear.forEach(date => {
        expect(matchRegex(badPattern_2, date)).toBeFalsy();
    });
});

test('matchRegex (YYYYMMDD: year, month, day)', () => {
    const pattern = "^(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])$";
    const badPattern_1 = "^(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])$/g";
    const badPattern_2 = "^(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])$/gm";

    const testYearMonthDay = [
        '19000101', '19001231', '20000101', '20001231', '20210101', '20211231'
    ];

    testYearMonthDay.forEach(date => {
        expect(matchRegex(pattern, date)).toBeTruthy();
    });

    testYearMonthDay.forEach(date => {
        expect(matchRegex(badPattern_1, date)).toBeFalsy();
    });

    testYearMonthDay.forEach(date => {
        expect(matchRegex(badPattern_2, date)).toBeFalsy();
    });
});

test ('matchRegex-Time (HH:MM:SS: hour, minutes, seconds 12 hour notation AM/PM)', () => {
    const pattern = "^(0?[1-9]|1[0-2]):[0-5][0-9]:[0-5][0-9] ?[APMapm]{2}$";

    const badPattern_1 = "^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$g"
    const badPattern_2 = "^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$gm"

    const testHourMinuteSecond = [
        '11:30:00 AM', '11:30:00 AM', '11:30:00 AM', '11:30:00 AM', '11:30:00 AM', '11:30:00 AM',
        '9:15:00 AM', '9:15:00 AM', '9:15:00 AM',
        '1:45:00 PM', '1:45:00 PM', '1:45:00 PM',
        '9:20:00 AM', '9:20:00 AM', '9:20:00 AM',
        '10:50:00 AM', '10:50:00 AM', '10:50:00 AM',
        '1:10:00 PM', '1:10:00 PM', '1:10:00 PM',
        '4:30:00 PM', '4:30:00 PM', '4:30:00 PM'
      ];

    testHourMinuteSecond.forEach(time => {
        expect(matchRegex(pattern, time)).toBeTruthy();
    });

    testHourMinuteSecond.forEach(time => {
        expect(matchRegex(badPattern_1, time)).toBeFalsy();
    });

    testHourMinuteSecond.forEach(time => {
        expect(matchRegex(badPattern_2, time)).toBeFalsy();
    });
      
});

test('matchRegex-Time (H:MM or HH:MM: hour, minutes AM/PM)', () => {
    const pattern = "^(12|0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM|am|pm)$";
    const badPattern_1 = "^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$g";
    const badPattern_2 = "^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$gm";

    const testHourMinute = [
        '01:00 AM', '12:30 PM', '09:15 AM', '01:45 PM', '09:20 AM', '10:50 AM', '01:10 PM', '04:30 PM']

    testHourMinute.forEach(time => {
        expect(matchRegex(pattern, time)).toBeTruthy();
    });

    testHourMinute.forEach(time => {
        expect(matchRegex(badPattern_1, time)).toBeFalsy();
    });

    testHourMinute.forEach(time => {
        expect(matchRegex(badPattern_2, time)).toBeFalsy();
    });
});
