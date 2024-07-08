
// const pattern = "^P(?!$)((\d+Y)|(\d+.\d+Y$))?((\d+M)|(\d+.\d+M$))?((\d+W)|(\d+.\d+W$))?((\d+D)|(\d+.\d+D$))?(T(?=\d)((\d+H)|(\d+.\d+H$))?((\d+M)|(\d+.\d+M$))?(\d+(.\d+)?S)?)??$";
const pattern = "^P(?!$)((\\d+Y)|(\\d+\\.\\d+Y))?((\\d+M)|(\\d+\\.\\d+M))?((\\d+W)|(\\d+\\.\\d+W))?((\\d+D)|(\\d+\\.\\d+D))?(T(?=\\d)((\\d+H)|(\\d+\\.\\d+H))?((\\d+M)|(\\d+\\.\\d+M))?(\\d+(\\.\\d+)?S)?)?$";


const testArray = [
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

const testExample = 'P1.5Y';

const regex = new RegExp(pattern);

console.log(regex.test(testExample));

testArray.forEach(example => {
    console.log(`${example}: ${regex.test(example)}`);
});
