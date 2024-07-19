// test('array-delimeters-checks', async () => {
//     function splitRespectingQuotes(dataEntry) {
//         const result = [];
//         let current = '';
//         let insideQuotes = false;
      
//         for (let i = 0; i < dataEntry.length; i++) {
//           const char = dataEntry[i];
      
//           if (char === '"') {
//             insideQuotes = !insideQuotes;
//           } else if (!insideQuotes && /[,;|]/.test(char)) {
//             result.push(current);
//             current = '';
//           } else {
//             current += char;
//           }
//         }
        
//         // Push the last part
//         if (current) {
//           result.push(current);
//         }
      
//         return result;
//       }
      
//       const dataEntry = '"1,0,1",0,1,"1,0"';
//       const dataArr = splitRespectingQuotes(dataEntry);
      
//       console.log(dataArr);
    
// });

// function splitRespectingQuotes(dataEntry) {
//   const result = [];
//   let current = '';
//   let insideQuotes = false;

//   for (let i = 0; i < dataEntry.length; i++) {
//     const char = dataEntry[i];

//     if (char === '"') {
//       insideQuotes = !insideQuotes;
//     } else if (!insideQuotes && /[,;|]/.test(char)) {
//       result.push(current);
//       current = '';
//     } else {
//       current += char;
//     }
//   }
  
//   // Push the last part
//   if (current) {
//     result.push(current);
//   }

//   return result;
// }

// const dataEntry = "1,0,1,1";
// const dataArr = splitRespectingQuotes(dataEntry);

// console.log(dataArr); // ["1,0,1", "0", "1", "1,0"]


function splitRespectingQuotes(dataEntry) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < dataEntry.length; i++) {
    const char = dataEntry[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (!insideQuotes && /[,;|]/.test(char)) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Push the last part
  if (current) {
    result.push(current);
  }

  return result;
}

function processEntries(dataEntry) {
  const dataArr = splitRespectingQuotes(dataEntry);
  let newDataArr = [];

  dataArr.forEach(item => {
    if (item.includes(',')) {
      // If the item contains a comma, split it further and add each part
      newDataArr = newDataArr.concat(item.split(','));
    } else {
      // Otherwise, add the item directly
      newDataArr.push(item);
    }
  });

  return newDataArr;
}

const dataEntry = '1';
const newDataArr = processEntries(dataEntry);

console.log(newDataArr); // ['1', '0', '1', '0', '1', '1', '0']
