import React from 'react';
import { CustomPalette } from '../constants/customPalette';
import { Box, Checkbox, List, ListItem, ListItemText, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const items = [
  'Item 1',
  'Item 2',
];

const UserSelection = () => {
  const { t } = useTranslation();

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
        {items.map((item, index) => (
          <Box sx={{ display: 'flex', width: '100%' }}>
            <Box sx={{
              paddingLeft: '10px',
              paddingRight: '10px',
              borderBottom: index === items.length - 1 && `2px solid ${CustomPalette.GREY_300}`,
              borderLeft: `2px solid ${CustomPalette.GREY_300}`,
              borderRight: `2px solid ${CustomPalette.GREY_300}`,
              borderTop: index === 0 && `2px solid ${CustomPalette.GREY_300}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '40%',
            }}>
              <Typography>{item}</Typography>
            </Box>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '20%',
            }}>
              <List sx={{ display: 'flex', flexDirection: 'row' }}>
                <ListItem>
                  <Checkbox
                    color="primary"
                    checked={false}
                    onClick={() => { }}
                  />
                </ListItem>
                <ListItem sx={{ background: CustomPalette.GREY_300 }}>
                  <Checkbox
                    color="primary"
                    checked={false}
                    onClick={() => { }}
                  />
                </ListItem>
                <ListItem>
                  <Checkbox
                    color="primary"
                    checked={false}
                    onClick={() => { }}
                  />
                </ListItem>
              </List>
            </Box>
            <Box sx={{
              padding: '10px',
              borderBottom: index === items.length - 1 && `2px solid ${CustomPalette.GREY_300}`,
              borderLeft: `2px solid ${CustomPalette.GREY_300}`,
              borderRight: `2px solid ${CustomPalette.GREY_300}`,
              borderTop: index === 0 && `2px solid ${CustomPalette.GREY_300}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '40%',
              justifyContent: 'center',
            }}>
              <Typography>{item}</Typography>
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