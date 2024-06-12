import React, { useContext, useEffect, useState } from 'react';
import { CustomPalette } from '../constants/customPalette';
import { Box, Checkbox, List, ListItem, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Context } from '../App';

// const normalizeKeys = (obj) => {
//   const normalized = {};
//   for (const key in obj) {
//     if (obj.hasOwnProperty(key)) {
//       normalized[key.toLowerCase()] = obj[key];
//     }
//   }
//   return normalized;
// };

const checkIfKeyInList = (key, list) => {
  const lowercaseSearchString = key.toLowerCase();
  const isMatch = list.some(item => item.toLowerCase().includes(lowercaseSearchString));
  return isMatch;
};

const priorityKeys = ["META", 'Information', "ATTRIBUTE"];

const UserSelection = () => {
  const { t } = useTranslation();
  const { selectedOverlaysOCAFile1, selectedOverlaysOCAFile2 } = useContext(Context);
  const [data, setData] = useState([]);
  console.log('data', data);

  const handleChange = (index, key) => {
    setData(prev => {
      const newData = [...prev];

      if (key === 'ocaFile1Checked') {
        newData[index].ocaFile1Checked = !newData[index].ocaFile1Checked;
        newData[index].same = false;
        newData[index].ocaFile2Checked = false;
      } else if (key === 'ocaFile2Checked') {
        newData[index].ocaFile2Checked = !newData[index].ocaFile2Checked;
        newData[index].same = false;
        newData[index].ocaFile1Checked = false;
      } else if (key === 'same') {
        newData[index].same = !newData[index].same;
        newData[index].ocaFile1Checked = false;
        newData[index].ocaFile2Checked = false;
      }
      return newData;
    });
  };

  useEffect(() => {
    // const normalizedOCAFile1 = normalizeKeys(selectedOverlaysOCAFile1);
    // const normalizedOCAFile2 = normalizeKeys(selectedOverlaysOCAFile2);
    // const keysObj1 = Object.keys(normalizedOCAFile1);
    // const keysObj2 = Object.keys(normalizedOCAFile2);
    const keysObj1 = Object.keys(selectedOverlaysOCAFile1);
    const keysObj2 = Object.keys(selectedOverlaysOCAFile2);
    const uniqueKeys = [...new Set([...keysObj1, ...keysObj2])];
    const temp = [];

    const combinedList = uniqueKeys.reduce((acc, key) => {
      console.log('temp', temp);
      if (!temp?.includes(key.toLowerCase())) {
        temp.push(key.toLowerCase());
        acc.push(
          {
            key: key,
            ocafile1: checkIfKeyInList(key, keysObj1) ? key : "NONE",
            ocafile2: checkIfKeyInList(key, keysObj2) ? key : "NONE",
            ocaFile1Checked: false,
            ocaFile2Checked: false,
            same: false
          }
        );
      }
      return acc;
    }, []);

    const sortedList = combinedList.sort((a, b) => {
      const aPriority = priorityKeys.findIndex(keyword => a.key.includes(keyword));
      const bPriority = priorityKeys.findIndex(keyword => b.key.includes(keyword));

      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority;
      } else if (aPriority !== -1) {
        return -1;
      } else if (bPriority !== -1) {
        return 1;
      } else {
        return a.key.localeCompare(b.key);
      }
    });

    setData(sortedList);
  }, [selectedOverlaysOCAFile1, selectedOverlaysOCAFile2]);

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      padding: '2rem',
    }}>
      <Box sx={{ display: 'flex', width: '100%' }}>
        <Box sx={{
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '40%',
        }}>
          <Typography sx={{ fontWeight: "bold", fontSize: "1.5rem" }}>{t('OCA File 1')}</Typography>
        </Box>
        <Box sx={{
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '20%',
        }}>
          <Typography sx={{ fontWeight: "bold", fontSize: "1.5rem" }}>{t('Selection')}</Typography>
        </Box>
        <Box sx={{
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '40%',
        }}>
          <Typography sx={{ fontWeight: "bold", fontSize: "1.5rem" }}>{t('OCA File 2')}</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', width: '100%', flexDirection: 'column' }}>
        {data.map((item, index) => (
          <Box sx={{ display: 'flex', width: '100%' }}>
            <Box sx={{
              paddingLeft: '10px',
              paddingRight: '10px',
              borderBottom: index === data.length - 1 && `2px solid ${CustomPalette.GREY_300}`,
              borderLeft: `2px solid ${CustomPalette.GREY_300}`,
              borderRight: `2px solid ${CustomPalette.GREY_300}`,
              borderTop: index === 0 && `2px solid ${CustomPalette.GREY_300}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '40%',

            }}>
              <Typography sx={{ fontWeight: item?.ocafile1 === "NONE" ? '500' : 'normal', }}>{item?.ocafile1}</Typography>
            </Box>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '20%',
            }}>
              <List sx={{ display: 'flex', flexDirection: 'row', padding: 0 }}>
                <ListItem>
                  <Checkbox
                    color="primary"
                    checked={item?.ocaFile1Checked}
                    onClick={() => handleChange(index, 'ocaFile1Checked')}
                  />
                </ListItem>
                <ListItem sx={{ background: CustomPalette.GREY_300 }}>
                  <Checkbox
                    color="primary"
                    checked={item?.same}
                    onClick={() => handleChange(index, 'same')}
                  />
                </ListItem>
                <ListItem>
                  <Checkbox
                    color="primary"
                    checked={item?.ocaFile2Checked}
                    onClick={() => handleChange(index, 'ocaFile2Checked')}
                  />
                </ListItem>
              </List>
            </Box>
            <Box sx={{
              paddingLeft: '10px',
              paddingRight: '10px',
              borderBottom: index === data.length - 1 && `2px solid ${CustomPalette.GREY_300}`,
              borderLeft: `2px solid ${CustomPalette.GREY_300}`,
              borderRight: `2px solid ${CustomPalette.GREY_300}`,
              borderTop: index === 0 && `2px solid ${CustomPalette.GREY_300}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '40%',
              justifyContent: 'center',
            }}>
              <Typography sx={{ fontWeight: item?.ocafile2 === "NONE" ? '500' : 'normal', }}>{item?.ocafile2}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box >
  );
};

export default UserSelection;

// const UserSelection = () => {
//   const { t } = useTranslation();

//   return (
//     <Box sx={{
//       display: 'flex',
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'center',
//       flex: 1,
//       padding: '2rem',
//     }}>
//       <Box sx={{
//         width: '100%',
//         maxWidth: '40%',
//       }}>
//         <Box sx={{ padding: '10px' }}>
//           <Typography sx={{ fontWeight: "bold", fontSize: "1.5rem" }}>{t('OCA File 1')}</Typography>
//         </Box>
//         <Box sx={{
//           padding: '10px',
//           borderBottom: `2px solid ${CustomPalette.GREY_300}`,
//           borderLeft: `2px solid ${CustomPalette.GREY_300}`,
//           borderRight: `2px solid ${CustomPalette.GREY_300}`,
//           borderTop: `2px solid ${CustomPalette.GREY_300}`,
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'center',

//         }}>
//           <List>
//             {items.map((item, index) => (
//               <ListItem key={index}>
//                 <ListItemText primary={item} />
//               </ListItem>
//             ))}
//           </List>
//         </Box>
//       </Box >

//       <Box sx={{
//         width: '100%',
//         maxWidth: '20%',
//       }}>
//         <Box sx={{ padding: '10px' }}>
//           <Typography sx={{ fontWeight: "bold", fontSize: "1.5rem" }}>{t('Selection')}</Typography>
//         </Box>
//         <Box sx={{
//           padding: '10px',
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'center',
//         }}>
//           <Box sx={{
//             display: 'flex',
//             flexDirection: 'row',
//             width: '100%',
//             maxWidth: '33%',
//           }}>
//             <List>
//               {items.map((item, index) => (
//                 <ListItem key={index}>
//                   <ListItemText primary={item} />
//                 </ListItem>
//               ))}
//             </List>
//             <List>
//               {items.map((item, index) => (
//                 <ListItem key={index}>
//                   <ListItemText primary={item} />
//                 </ListItem>
//               ))}
//             </List>
//             <List>
//               {items.map((item, index) => (
//                 <ListItem key={index}>
//                   <ListItemText primary={item} />
//                 </ListItem>
//               ))}
//             </List>
//           </Box>
//         </Box>
//       </Box>

//       <Box sx={{
//         width: '100%',
//         maxWidth: '40%',
//       }}>
//         <Box sx={{ padding: '10px' }}>
//           <Typography sx={{ fontWeight: "bold", fontSize: "1.5rem" }}>{t('OCA File 2')}</Typography>
//         </Box>
//         <Box sx={{
//           padding: '10px',
//           borderBottom: `2px solid ${CustomPalette.GREY_300}`,
//           borderLeft: `2px solid ${CustomPalette.GREY_300}`,
//           borderRight: `2px solid ${CustomPalette.GREY_300}`,
//           borderTop: `2px solid ${CustomPalette.GREY_300}`,
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'center',

//         }}>
//           <List>
//             {items.map((item, index) => (
//               <ListItem key={index}>
//                 <ListItemText primary={item} />
//               </ListItem>
//             ))}
//           </List>
//         </Box>
//       </Box>
//     </Box >
//   );
// };