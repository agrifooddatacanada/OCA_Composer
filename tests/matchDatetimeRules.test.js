import { matchDatetime } from '../src/OCADataValidator/utils/matchRules';
import { descriptionToFormatCodeDate } from '../src/constants/constants';

test('matchDatetime (ISO: YYYY-MM-DD: year month day)', () => {
    const pattern = descriptionToFormatCodeDate['ISO: YYYY-MM-DD: year month day']
    const testDates = [
        "0000-01-01",
        "9999-12-31",
        "2023-02-29",
        "2024-02-29",
        "2023-04-31"
      ];

      const badTestDates = [
        "10000-02-32",
        "2023-13-31",
        "2023-16-31",
        "105-09-31",
        "20234-02-30",
      ];
      
      testDates.forEach(date => {
        expect(matchDatetime(pattern, date)).toBeTruthy();
    });

    badTestDates.forEach(date => {
        expect(matchDatetime(pattern, date)).toBeFalsy();
    });
});

test('matchDatetime (ISO: YYYYMMDD: year month day)', () => {
  const pattern = descriptionToFormatCodeDate['ISO: YYYYMMDD: year month day'];

  const testDates = [
    "00000101",
    "99991231",
    "20230229",
    "20240229",
    "20230431"
  ];

  const badTestDates = [
    "100000232",
    "20231331",
    "20231631",
    "1050931",
    "202340230",
  ];
  
  testDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test('matchDatetime (ISO: YYYY-MM: year month)', () => {
  const pattern = descriptionToFormatCodeDate['ISO: YYYY-MM: year month'];

  const testDates = [
    "0000-01",
    "9999-12",
    "2023-02",
    "2024-02",
    "2023-04"
  ];

  const badTestDates = [
    "10000-02",
    "2023-13",
    "2023-16",
    "105-09",
    "20234-02",
  ];
  
  testDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});


test('matchDatetime (ISO: YYYY-Www: year week)', () => {
  const pattern =  descriptionToFormatCodeDate['ISO: YYYY-Www: year week (e.g. W01)'];

  const testDates = [
    "0000-W01",
    "9999-W52",
    "2023-W01",
    "2024-W52",
    "2023-W04"
  ];

  const badTestDates = [
    "10000-W02",
    "2023-W54",
    "2023-W56",
    "105-W09",
    "20234-W02",
  ];
  
  testDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test('matchDatetime (ISO: YYYYWww: year week)', () => {
  const pattern = descriptionToFormatCodeDate['ISO: YYYYWww: year week (e.g. W01)'];

  const testDates = [
    "0000W01",
    "9999W52",
    "2023W01",
    "2024W52",
    "2023W04"
  ];

  const badTestDates = [
    "10000W02",
    "2023W54",
    "2023W56",
    "105W09",
    "20234W02",
  ];
  
  testDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test('matchDatetime (ISO: YYYY-DDD: Ordinal date (day number from the year))', () => {
  const pattern = descriptionToFormatCodeDate['ISO: YYYY-DDD: Ordinal date (day number from the year)'];
  const testDates = [
    "0000-001",
    "9999-365",
    "2023-001",
    "2024-366",
    "2023-120"
  ];

  const badTestDates = [
    "10000-002",
    "2023-367",
    "2023-0366",
    "105-009",
    "20234-002",
  ];
  
  testDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test('matchDatetime (ISO: YYYYDDD: Ordinal date (day number from the year))', () => {
  const pattern = descriptionToFormatCodeDate['ISO: YYYYDDD: Ordinal date (day number from the year)'];
  const testDates = [
    "0000001",
    "9999365",
    "2023001",
    "2024366",
    "2023120"
  ];

  const badTestDates = [
    "10000021",
    "2023367",
    "20230366",
    "10500093",
    "20234002",
  ];
  
  testDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test('matchDatetime (ISO: YYYY: year)', () => {
  const pattern = descriptionToFormatCodeDate['ISO: YYYY: year'];
  const testYears = [
    "0000",
    "9999",
    "2023",
    "2024",
    "2023"
  ];

  const badTestYears = [
    "10000",
    "20234",
    "2023-",
    "105",
    "20234-",
  ];
  
  testYears.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestYears.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test('matchDatetime (ISO: MM: month)', () => {
  const pattern = descriptionToFormatCodeDate['ISO: MM: month'];
  const testMonths = [
    "01",
    "12",
    "02",
    "04",
    "09"
  ];

  const badTestMonths = [
    "00",
    "13",
    "16",
    "13",
    "34",
  ];

  testMonths.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestMonths.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});


test('matchDatetime (ISO: DD: day)', () => {
  const pattern = descriptionToFormatCodeDate['ISO: DD: day'];
  const testDays = [
    "01",
    "31",
    "29",
    "29",
    "31"
  ];

  const badTestDays = [
    "001",
    "32",
    "35",
    "38",
    "000",
  ];

  testDays.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestDays.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test('matchDatetime (ISO: YYYY-MM-DDTHH:MM:SSZ: Date and Time Combined (UTC))', () => {
  const pattern = descriptionToFormatCodeDate['ISO: YYYY-MM-DDTHH:MM:SSZ: Date and Time Combined (UTC)'];
  const testDates = [
    "0000-01-01T00:00:00Z",
    "9999-12-31T23:59:59Z",
    "2023-02-29T23:59:59Z",
    "2024-02-29T23:59:59Z",
    "2023-04-31T23:59:59Z"
  ];

  const badTestDates = [
    "10000-02-28T10:59:59Z",
    "2023-13-31T04:59:59Z",
    "2023-11-33T11:59:59Z",
    "1054-09-11T:61:59Z",
    "2023-02-30T02:30:61Z",
  ];
  
  testDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test('matchDatetime (ISO: YYYY-MM-DDTHH:MM:SS±hh:mm: year month day hour minute second timezone)', () => {
  const pattern = descriptionToFormatCodeDate['ISO: YYYY-MM-DDTHH:MM:SS±hh:mm: Date and Time Combined (with Timezone Offset)'];
  const testDates = [
    "0000-01-01T00:00:00+00:00",
    "9999-12-31T23:59:59+00:00",
    "2023-02-29T23:59:59+00:00",
    "2024-02-29T23:59:59+00:00",
    "2023-04-31T23:59:59+00:00"
  ];

  const badTestDates = [
    "10000-02-28T10:59:59+00:00",
    "2023-13-31T04:59:59+00:00",
    "2023-11-33T11:59:59+00:00",
    "1054-09-11T:61:59+00:00",
    "2023-02-30T02:30:61+00:00",
    "2023-02-28T23:59:59-24:00",
    "2023-02-28T23:59:59+25:00",
    "2023-02-28T23:59:59+00:61",
    "2023-02-28T23:59:59+00:00:30"
  ];
  
  testDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test('matchDatetime (ISO: PnYnMnDTnHnMnS: duration)', () => {
  const pattern = descriptionToFormatCodeDate['ISO: PnYnMnDTnHnMnS :durations e.g. P3Y6M4DT12H30M5S'];
  const testDurations = [
    "P1Y",
    "P1M",
    "P1D",
    "PT1H",
    "PT1M",
    "PT1S",
    "P1Y1M1D",
    "P1Y1M1DT1H1M1S"
  ];

  const badTestDurations = [
    "P1Y1Y",
    "P1M1M",
    "P1D1D",
    "PT1H1H",
    "PT1M1M",
    "PT1S1S",
    "P1Y1M1M",
    "P1Y1M1DT1H1M1M"
  ];
  
  testDurations.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestDurations.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});


test ('matchDatetime (ISO: HH:MM: hour, minutes in 24 hour notation)', () => {

  const pattern = descriptionToFormatCodeDate['ISO: HH:MM: hour, minutes in 24 hour notation'];
  const testTimes = [
    "00:00",
    "23:59",
    "02:59",
    "04:59",
    "09:59"
  ];

  const badTestTimes = [
    "00:60",
    "24:00",
    "25:00",
    "114:59",
    "00:61",
  ];

  testTimes.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestTimes.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test('matchDatetime (ISO: HH:MM:SS: hour, minutes, seconds in 24 hour notation)', () => {
  const pattern = descriptionToFormatCodeDate['ISO: HH:MM:SS: hour, minutes, seconds in 24 hour notation'];
  const testTimes = [
    "00:00:00",
    "23:59:59",
    "02:59:59",
    "04:59:59",
    "09:59:59"
  ];

  const badTestTimes = [
    "00:60:00",
    "24:00:00",
    "25:00:00",
    "114:59:00",
    "00:61:00",
    "00:00:60",
  ];

  testTimes.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestTimes.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test('matchDatetime (DD/MM/YYYY: day, month, year)', () => {
  const pattern = descriptionToFormatCodeDate['DD/MM/YYYY: day, month, year'];
  const testDates = [
    "01/01/0000",
    "31/12/9999",
    "29/02/2023",
    "29/02/2024",
    "31/04/2023"
  ];

  const badTestDates = [
    "32/02/10000",
    "31/13/2023",
    "31/16/2023",
    "31/09/105",
    "30/02/20234",
  ];

  testDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test('matchDatetime (DD/MM/YY: day, month, year)', () => {
  const pattern = descriptionToFormatCodeDate['DD/MM/YY: day, month, year'];
  const testDates = [
    "01/01/00",
    "31/12/99",
    "29/02/23",
    "29/02/24",
    "31/04/23"
  ];

  const badTestDates = [
    "32/02/100",
    "31/13/23",
    "31/16/23",
    "33/09/05",
    "30/02/234",
  ];

  testDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test('matchDatetime (MM/DD/YYYY: month, day, year)', () => {
  const pattern = descriptionToFormatCodeDate['MM/DD/YYYY: month, day, year'];
  const testDates = [
    "01/01/0000",
    "12/31/9999",
    "02/29/2023",
    "02/29/2024",
    "04/31/2023"
  ];

  const badTestDates = [
    "02/32/10000",
    "13/31/2023",
    "16/31/2023",
    "09/31/105",
    "02/30/20234",
  ];
  
  testDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test('matchDatetime (DDMMYYYY: day, month, year)', () => {
  const pattern = descriptionToFormatCodeDate['DDMMYYYY: day, month, year'];
  const testDates = [
    "01010000",
    "31129999",
    "29022023",
    "29022024",
    "31042023"
  ];

  const badTestDates = [
    "320210000",
    "31312023",
    "31612023",
    "310920105",
    "300220234",
  ];
  
  testDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test('matchDatetime (MMDDYYYY: month, day, year)', () => {
  const pattern = descriptionToFormatCodeDate['MMDDYYYY: month, day, year'];
  const testDates = [
    "01010000",
    "12319999",
    "02292023",
    "02292024",
    "04312023"
  ];

  const badTestDates = [
    "0213201000",
    "31132023",
    "31162023",
    "0931105",
    "022300234",
  ];
  
  testDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test('matchDatetime (YYYYMMDD: year, month, day)', () => {
  const pattern = descriptionToFormatCodeDate['YYYYMMDD: year, month, day'];
  const testDates = [
    "00000101",
    "99991231",
    "20230229",
    "20240229",
    "20230431"
  ];

  const badTestDates = [
    "100000232",
    "20231331",
    "20231631",
    "1050931",
    "202340230",
  ];

  testDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestDates.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test ('matchDatetime (HH:MM:SS: hour, minutes, seconds 12 hour notation AM/PM)', () => {
  const pattern = descriptionToFormatCodeDate['HH:MM:SS: hour, minutes, seconds 12 hour notation AM/PM'];
  const testTimes = [
    "01:00:00 AM",
    "12:59:59 PM",
    "02:59:59 am",
    "04:59:59 pm",
    "09:59:59 AM"
  ];

  const badTestTimes = [
    "00:60:00 am",
    "13:00:00 PM",
    "25:00:00 pm",
    "114:59:00 PM",
    "00:61:00 AM",
  ];

  testTimes.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestTimes.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});

test('matchDatetime (H:MM or HH:MM: hour, minutes AM/PM)', () => {
  const pattern = descriptionToFormatCodeDate['H:MM or HH:MM: hour, minutes AM/PM'];
  const testTimes = [
    "1:00 AM",
    "12:59 PM",
    "2:59 am",
    "4:59 pm",
    "9:59 AM"
  ];

  const badTestTimes = [
    "00:60 am",
    "13:00 PM",
    "25:00 pm",
    "14:59 PM",
    "00:61 AM",
  ];

  testTimes.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeTruthy();
  });

  badTestTimes.forEach(date => {
    expect(matchDatetime(pattern, date)).toBeFalsy();
  });
});