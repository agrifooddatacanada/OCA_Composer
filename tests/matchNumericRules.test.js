import { matchNumeric } from '../src/OCADataValidator/utils/matchRules';
import { descriptionToFormatCodeNumeric } from '../src/constants/constants';

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

// test('matchNumeric (any integer)', () => {
//     const pattern = descriptionToFormatCodeNumeric["any integer"]; ;
//     const testNumeric = [
//         "1", "-1", "+1", "0", "0.0", "0.0001", "okay"
//     ];

    // const testNonNumeric = [
    //     "1.", "1.0.", "1.0.0", "1.0.0.",
    // ];

    // testNumeric.forEach((dataStr) => {
    //     expect(matchNumeric(pattern, dataStr)).toBeTruthy;
    // });

    // testNonNumeric.forEach((dataStr) => {
    //     expect(matchNumeric(pattern, dataStr)).toBeFalsy();
    // });
// });