import { matchRegex } from '../src/OCADataValidator/utils/matchRules';

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

test ('matchRegex-Time (ISO: HH:MM:SS: hour, minutes, seconds in 24 hour notation)', () => {
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