import { matchDatetime } from '../src/OCADataValidator/utils/matchRules';
import { descriptionToFormatCodeText } from '../src/constants/constants';

test('match Regex (Entries of any length with only capital letters)', () => {
    const pattern = descriptionToFormatCodeText["Entries of any length with only capital letters"];
    const testTexts = [
        "ABC",
        "ABCDEFF",
        "A",
        "AABBGGFFRREEDDSSWWQQQQQQTTGHTYUUIOPLKJHGFDSAZXCVBNM",
    ];

    const badTestTexts = [
        "abc123",
        "abc",
        "123",
        "abcABC",
        "Aaa"
    ];

    testTexts.forEach((text) => {
        expect(matchDatetime(pattern, text)).toBeTruthy();
    });

    badTestTexts.forEach((text) => {
        expect(matchDatetime(pattern, text)).toBeFalsy();
    });
});

test('match Regex (Capital or lower case letters only, at least 1 character, and 50 characters max)', () => {
    const pattern = descriptionToFormatCodeText["Capital or lower case letters only, at least 1 character, and 50 characters max"];
    const testTexts = [
        "ABC",
        "abc",
        "ABCDEFF",
        "A",
    ];

    const badTestTexts = [
        "",
        "abc123",
        "AAAAAAAAAAAAEEEEEEEsssssssEEEEEEEERRRrrrrrrTTTTTTTTYyYYYyyyUUUUUIIIIIIIIIIIIIIII",
        "123",
    ];

    testTexts.forEach((text) => {
        expect(matchDatetime(pattern, text)).toBeTruthy();
    });

    badTestTexts.forEach((text) => {
        expect(matchDatetime(pattern, text)).toBeFalsy();
    });
});

test('match Regex (Capital or lower case letters only, 50 characters max)', () => {
    const pattern = descriptionToFormatCodeText["Capital or lower case letters only, 50 characters max"];
    const testTexts = [
        "",
        "ABC",
        "abc",
        "ABCDEFF",
        "A",
    ];

    const badTestTexts = [
        "abc123",
        "123",
        "AAAAAAAAAAAAEEEEEEEsssssssEEEEEEEERRRrrrrrrTTTTTTTTYyYYYyyyUUUUUIIIIIIIIIIIIIIII",
        "1 "
    ];

    testTexts.forEach((text) => {
        expect(matchDatetime(pattern, text)).toBeTruthy();
    });

    badTestTexts.forEach((text) => {
        expect(matchDatetime(pattern, text)).toBeFalsy();
    });
});

test('match Regex (Short text, 50 characters max)', () => {
    const pattern = descriptionToFormatCodeText["Short text, 50 characters max"];
    const testTexts = [
        "",
        "ABC",
        "abc",
        "ABCDEFF",
        "A",
        "abc123",
        "123",
    ];

    const badTestTexts = [
        "AAAAAAAAAAAAEEEEEEEsssssssEEEEEEEERRRrrrrrrTTTTTTTTYyYYYyyyUUUUUIIIIIIIIIIIIIIIII",
    ];

    testTexts.forEach((text) => {
        expect(matchDatetime(pattern, text)).toBeTruthy();
    });

    badTestTexts.forEach((text) => {
        expect(matchDatetime(pattern, text)).toBeFalsy();
    });
});

test('match Regex (Short text, 250 characters max)', () => {
    const pattern = descriptionToFormatCodeText["Short text, 250 characters max"];
    const testTexts = [
        "",
        "ABC",
        "abc",
        "ABCDEFF",
        "A",
        "abc123",
        "123",
        "AAAAAAAAAAAAEEEEEEEsssssssEEEEEEEERRRrrrrrrTTTTTTTTYyYYYyyyUUUUUIIIIIIIIIIIIIIIII",
    ];

    const badTestTexts = [
        "AAAAAAAAAAAAEEEEEEEsssssssEEEEEEEERRRrrrrrrTTTTTTTTYyYYYyyyUUUUUIIIIIIIIIIIIIIIIIIIaddeeddddeeedfd232222223323233deedfrrrr111122dewdeewdlejakfjlofjaklajfopjaodsjfAJFALDFJALDFJADLKSJFALEJIOPDVJNADOHJFAOEJFADOVCNAODHFOAHJFAOJFOIAJFOIAJFOJFIAEFAHFadfjaldfjald aljfladfjlad adfj adlfjadjf l;adjfljad;fad fdaf adjf dfdf alfjdafljadad fladjfl jfjd f adfjfjdadfjeofefre=aqefqewfrqefjadflaejfaoejfoeajfoajefeafjaeljl;ajfaqejfeoijfojefoejfieofjejfqi",
    ];

    testTexts.forEach((text) => {
        expect(matchDatetime(pattern, text)).toBeTruthy();
    });

    badTestTexts.forEach((text) => {
        expect(matchDatetime(pattern, text)).toBeFalsy();
    });
});


// export const descriptionToFormatCodeText = {
//     "": "",
//     "Entries of any length with only capital letters": "^[A-Z]*$",
//     "Capital or lower case letters only, at least 1 character, and 50 characters max": "^[A-Za-z]{1,50}$",
//     "Capital or lower case letters only, 50 characters max": "^[A-Za-z]{0,50}$",
//     "Short text, 50 characters max": "^.{0,50}$",
//     "Short text, 250 characters max": "^.{0,250}$",
//     "long text, 800 characters max": "^.{0,800}$",
//     "long text, 4000 characters max": "^.{0,4000}$",
//     "Canadian postal codes (A1A 1A1)": "^[A-Z][0-9][A-Z]\\s[0-9][A-Z][0-9]$",
//     "Zip code": "^\\d{5,6}(?:[-\\s]\\d{4})?$",
//     "Email address": "[a-zA-Z0-9_\\.\\+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-\\.]+",
//     "URL": "https?\\:\\/\\/[a-zA-Z0-9\\-\\.]+\\.[a-zA-Z]{2,}",
//     "Phone number": "\\+?\\(?\\d{2,4}\\)?[\\d\\s-]{3,}"
//   };

test('match Regex (long text, 800 characters max)', () => {
    const pattern = descriptionToFormatCodeText["long text, 800 characters max"];
    const testTexts = [
        "",
        "ABC",
        "abc",
        "ABCDEFF",
        "A",
        "abc123",
        "123",
        "AAAAAAAAAAAAEEEEEEEsssssssEEEEEEEERRRrrrrrrTTTTTTTTYyYYYyyyUUUUUIIIIIIIIIIIIIIIII",
        "AAAAAAAAAAAAEEEEEEEsssssssEEEEEEEERRRrrrrrrTTTTTTTTYyYYYyyyUUUUUIIIIIIIIIIIIIIIIIaddeeddddeeedfd232222223323233deedfrrrr111122dewdeewdlejakfjlofjaklajfopjaodsjfAJFALDFJALDFJADLKSJFALEJIOPDVJNADOHJFAOEJFADOVCNAODHFOAHJFAOJFOIAJFOIAJFOJFIAEFAHFadfjaldfjald aljfladfjlad adfj adlfjadjf l;adjfljad;fad fdaf adjf dfdf alfjdafljadad fladjfl jfjd f adfjfjdadfjeofefre=aqefqewfrqefjadflaejfaoejfoeajfoajefeafjaeljl;ajfaqejfeoijfojefoejfieofjejfqi",
    ];

    const badTestTexts = [
        "AAAAAAAAAAAAEEEEEEEsssssssEEEEEEEERRRrrrrrrTTTTTTTTYyYYYyyyUUUUUIIIIIIIIIIIIIIIIIIIaddeeddddeeedfd232222223323233deedfrrrr111122dewdeewdlejakfjlofjaklajfopjaodsjfAJFALDFJALDFJADLKSJFALEJIOPDVJNADOHJFAOEJFADOVCNAODHFOAHJFAOJFOIAJFOIAJFOJFIAEFAHFadfjaldfjald aljfladfjlad adfj adlfjadjf l;adjfljad;fad fdaf adjf dfdf alfjdafljadad fladjfl jfjd f adfjfjdadfjeofefre=aqefqewfrqefjadflaejfaoejfoeajfoajefeafjaeljl;ajfaqejfeoijfojefoejfieofjejfqiAAAAAAAAAAAAEEEEEEEsssssssEEEEEEEERRRrrrrrrTTTTTTTTYyYYYyyyUUUUUIIIIIIIIIIIIIIIIIIIaddeeddddeeedfd232222223323233deedfrrrr111122dewdeewdlejakfjlofjaklajfopjaodsjfAJFALDFJALDFJADLKSJFALEJIOPDVJNADOHJFAOEJFADOVCNAODHFOAHJFAOJFOIAJFOIAJFOJFIAEFAHFadfjaldfjald aljfladfjlad adfj adlfjadjf l;adjfljad;fad fdaf adjf dfdf alfjdafljadad fladjfl jfjd f adfjfjdadfjeofefre=aqefqewfrqefjadflaejfaoejfoeajfoajefeafjaeljl;ajfaqejfeoijfojefoejfieofjejfqi",
    ];

    testTexts.forEach((text) => {
        expect(matchDatetime(pattern, text)).toBeTruthy();
    });

    badTestTexts.forEach((text) => {
        expect(matchDatetime(pattern, text)).toBeFalsy();
    });
});

test ('match Regex (Canadian postal codes (A1A 1A1))', () => {
    const pattern = descriptionToFormatCodeText["Canadian postal codes (A1A 1A1)"];
    const testTexts = [
        "A1A 1A1",
        "N2L 3G1",
        "J8T 1A1",
        "K1A 1A1",

    ];

    const badTestTexts = [
        "AA2A1A",
        "A1A1A",
        "A1A 1A",
        "A12 1A1",
        "N2L3G1"
    ];

    testTexts.forEach((text) => {
        expect(matchDatetime(pattern, text)).toBeTruthy();
    });

    badTestTexts.forEach((text) => {
        expect(matchDatetime(pattern, text)).toBeFalsy();
    });
});

test ('match Regex (Zip code)', () => {
    const pattern = descriptionToFormatCodeText["Zip code"];
    const testTexts = [
        "12345",
        "12345-1234",
        "12345 1234",
        "123456",
        "123456-1234",
        "123456 1234",
    ];

    const badTestTexts = [
        "A1A 1A1",
        "1234",
        "1234-1234",
        "1234 1234",
        "1234567",
        "1234567-1234",
        "1234567 1234",
        "123456 12345",
        "123456 123456",
        "123456 1234567",
    ];

    testTexts.forEach((text) => {
        expect(matchDatetime(pattern, text)).toBeTruthy();
    });

    badTestTexts.forEach((text) => {
        expect(matchDatetime(pattern, text)).toBeFalsy();
    });
});


test ('match Regex (Email address)', () => {
    const pattern = descriptionToFormatCodeText["Email address"];

    const TestEmails = [
        "example1@something.com",
        "testemail@test.org",
        "gmailtesting@tested.test",
        "example1@something.c",
    ];

    const badTestEmails = [
        "example1@something",
        "example1@something.",
    ];


    TestEmails.forEach((email) => {
        expect(matchDatetime(pattern, email)).toBeTruthy();
    });

    badTestEmails.forEach((email) => {
        expect(matchDatetime(pattern, email)).toBeFalsy();
    });
});

test ('match Regex (URL)', () => {
    const pattern = descriptionToFormatCodeText["URL"];

    const TestURLs = [
        "http://www.google.com",
        "https://www.google.com",
        "http://www.google.com",
        "https://www.google.com",
        "http://www.google.com",
        "https://www.google.com",
    ];

    const badTestURLs = [
        // "http://example.com.",
        // "https://example.com..",
        // "http://example_com",
        // "https://example.com123",
        "http://.com"
    ];
    
    TestURLs.forEach((url) => {
        expect(matchDatetime(pattern, url)).toBeTruthy();
    });

    badTestURLs.forEach((url) => {
        expect(matchDatetime(pattern, url)).toBeFalsy();
    });
});

test ('match Regex (Phone number)', () => {
    const pattern = descriptionToFormatCodeText["Phone number"];

    const TestPhoneNumbers = [
        "1234567890",
        "123-456-7890",
        "123 456 7890",
        "123-456 7890",
        "123 456-7890",
        "+123 456 7890",
        "+123-456-7890",
        "+123 456-7890",
        "+123-456 7890",
        "+1234567890",
        "+123-4567890",
        "+123 4567890",
    ];

    const badTestPhoneNumbers = [
        "123456789",
        "123-456-789",
        "123 456 789",
        "123-456 789",
        "123 456-789",
        "+123 456 789",
        "+123-456-789",
        "+123 456-789",
        "+123-456 789",
        "+123456789",
        "+123-456789",
        "+123 456789",
        "12345678901",
        "123-456-78901",
        "123 456 78901",
        "123-456 78901",
        "123 456-78901",
        "+123 456 78901",
        "+123-456-78901",
        "+123 456-78901",
        "+123-456 78901",
        "+12345678901",
        "+123-45678901",
        "+123 45678901",
    ];

    TestPhoneNumbers.forEach((phone) => {
        expect(matchDatetime(pattern, phone)).toBeTruthy();
    });

    badTestPhoneNumbers.forEach((phone) => {
        expect(matchDatetime(pattern, phone)).toBeFalsy
    });
});