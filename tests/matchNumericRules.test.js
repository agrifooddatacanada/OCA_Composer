import { matchNumeric } from '../src/OCADataValidator/utils/matchRules';
import { descriptionToFormatCodeNumeric } from '../src/constants/constants';


// export const descriptionToFormatCodeNumeric = {
//     "": "",
//     "any integer or decimal number, may begin with + or -": "^[-+]?\\d*\\.?\\d+$",
//     // "decimal numbers between 0 and 1, inclusive": "^(0?(\\.\\d+)?|1(\\.0+)?)$",
//     // "positive integers": "^[0-9]*[1-9][0-9]*$",
//     "any integer": "^-?[0-9]+$",
//     // "any number between 0 and 100, inclusive": "^(100(\\.0+)?|0*([1-9]?\\d(\\.\\d+)?)|0)$",
//     "Latitude in formats S30°15'45.678\" or N12°30.999\"": "^[NS]-?(?:[0-8]?\\d|90)°(?:\\d+(?:\\.\\d+)?)(?:'(\\d+(?:\\.\\d+)?)\")?$",
//     "Longitude in formats E30°15'45.678\" or W90°00.000\"": "^[WE]-?(?:[0-8]?\\d|90)°(?:\\d+(?:\\.\\d+)?)(?:'(\\d+(?:\\.\\d+)?)\")?$"
//   };

test('matchNumeric', () => {
    const pattern = descriptionToFormatCodeNumeric["any integer or decimal number, may begin with + or -"]; 
    const testNumeric = [
        "1", "1.0", "-1", "-1.0", "+1", "+1.0", "0", "0.0", "0.0001", "1.", "1.0.0.0"
    ];

    const testNonNumeric = [
        "1.", "1.0.", "1.0.0", "1.0.0."
    ];

    testNumeric.forEach((dataStr) => {
        expect(matchNumeric(pattern, dataStr)).toBeTruthy;
    });

    testNonNumeric.forEach((dataStr) => {
        expect(matchNumeric(pattern, dataStr)).toBeFalsy();
    });
});

test('matchNumeric (any integer)', () => {
    // const pattern = descriptionToFormatCodeNumeric["any integer"]; 
    // console.log(`pattern: ${pattern}`);
    const pattern = "^-?[0-9]+$";
    const testNumeric = [
        "1", "-1", "+1", "0", "0.0", "0.0001", "okay"
    ];

    // const testNonNumeric = [
    //     "1.", "1.0.", "1.0.0", "1.0.0.",
    // ];

    testNumeric.forEach((dataStr) => {
        expect(matchNumeric(pattern, dataStr)).toBeTruthy;
    });

    // testNonNumeric.forEach((dataStr) => {
    //     expect(matchNumeric(pattern, dataStr)).toBeFalsy();
    // });
});