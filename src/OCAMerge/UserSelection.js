import React, { useContext, useEffect, useState } from 'react';
import { CustomPalette } from '../constants/customPalette';
import { Box, Button, Checkbox, List, ListItem, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Context } from '../App';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { CAPTURE_BASE, CHARACTER_ENCODING, CONFORMANCE, ENTRY, ENTRY_CODE, FORMAT, INFORMATION, LABEL, META, UNIT } from '../constants/constants';
import MergeDifferenceModal from './MergeDifferenceModal';
import JSZip from 'jszip';

const checkIfKeyInList = (key, list) => {
  const lowercaseSearchString = key.toLowerCase();
  const isMatch = list.some(item => item.toLowerCase() === lowercaseSearchString);
  return isMatch;
};

const priorityKeys = ["META", 'Information', "ATTRIBUTE"];

const findComparisonObject = (key) => {
  let objKey;
  switch (key) {
    case CAPTURE_BASE:
      objKey = 'attributes';
      break;
    case CHARACTER_ENCODING:
      objKey = 'attribute_character_encoding';
      break;
    case FORMAT:
      objKey = 'attribute_formats';
      break;
    case UNIT:
      objKey = 'attribute_units';
      break;
    case ENTRY_CODE:
      objKey = 'attribute_entry_codes';
      break;
    case LABEL:
      objKey = 'attribute_labels';
      break;
    case INFORMATION:
      objKey = 'attribute_information';
      break;
    case ENTRY:
      objKey = 'attribute_entries';
      break;
    case CONFORMANCE:
      objKey = 'attribute_conformance';
      break;
    default:
      break;
  }
  return objKey;
};

const UserSelection = () => {
  const { t } = useTranslation();
  const { selectedOverlaysOCAFile1, selectedOverlaysOCAFile2, parsedOCAFile1, OCAFile1Raw, OCAFile2Raw } = useContext(Context);
  const [data, setData] = useState([]);
  const [showDifference, setShowDifference] = useState(false);
  const [dataDifference, setDataDifference] = useState({
    title: '',
    rowData: [],
  });

  const processComparisonForDifference = (item) => {
    if (item.ocafile1 === "NONE" && item.ocafile2 === "NONE") {
      return;
    }
    // const objKey = item.key.split(' - ')?.[0];
    const value1 = selectedOverlaysOCAFile1?.[item.key];
    const value2 = selectedOverlaysOCAFile2?.[item.key];

    if (item.key.includes(META)) {
      const descriptionObj = {
        comparisonValue: "description",
        ocaFile1: value1?.description,
        ocaFile2: value2?.description,
      };
      const nameObj = {
        comparisonValue: "name",
        ocaFile1: value1?.name,
        ocaFile2: value2?.name,
      };
      setDataDifference({
        title: item.key,
        rowData: [descriptionObj, nameObj],
      });
    } else if (item.key === CAPTURE_BASE) {
      const classificationObj = {
        comparisonValue: "classification",
        ocaFile1: value1?.classification,
        ocaFile2: value2?.classification,
      };
      const uniqueKeys = new Set([
        ...Object.keys(value1.attributes || {}),
        ...Object.keys(value2.attributes || {}),
      ]);

      const attributesComparison = Array.from(uniqueKeys).map(key => ({
        comparisonValue: key,
        ocaFile1: value1.attributes?.[key],
        ocaFile2: value2.attributes?.[key],
      }));

      setDataDifference({
        title: item.key,
        rowData: [classificationObj, ...attributesComparison],
      });
    } else if (item.key === CHARACTER_ENCODING || item.key.includes(LABEL) || item.key.includes(INFORMATION) || item.key.includes(CONFORMANCE) || item.key.includes(UNIT)) {
      const comparisonObj = findComparisonObject(item.key.split(' - ')?.[0]);
      const uniqueKeys = new Set([
        ...Object.keys(value1?.[comparisonObj] || {}),
        ...Object.keys(value2?.[comparisonObj] || {}),
      ]);

      const attributesComparison = Array.from(uniqueKeys).map(key => ({
        comparisonValue: key,
        ocaFile1: value1?.[comparisonObj]?.[key],
        ocaFile2: value2?.[comparisonObj]?.[key],
      }));

      setDataDifference({
        title: item.key,
        rowData: attributesComparison,
      });
    }

    setShowDifference(true);
  };

  const handleChange = (index, key) => {
    setData(prev => {
      const newData = [...prev];

      if (key === 'ocaFile1Checked') {
        newData[index].ocaFile1Checked = !newData[index].ocaFile1Checked;
        newData[index].ocaFile2Checked = false;
      } else if (key === 'ocaFile2Checked') {
        newData[index].ocaFile2Checked = !newData[index].ocaFile2Checked;
        newData[index].ocaFile1Checked = false;
      } else if (key === 'same') {
        newData[index].same = !newData[index].same;
      }
      return newData;
    });
  };

  const preparedJSONToExport = () => {
    let exportedFile;
    exportedFile = {
      d: parsedOCAFile1.d,
      v: parsedOCAFile1.v,
    };
    const overlays = {};
    data.forEach(item => {
      const key = item.key;
      let value = null;
      if ((item.ocaFile1Checked && key in selectedOverlaysOCAFile1) || item.same) {
        value = selectedOverlaysOCAFile1[key];
      } else if (item.ocaFile2Checked && key in selectedOverlaysOCAFile2) {
        value = selectedOverlaysOCAFile2[key];
      }

      if (value && key === CAPTURE_BASE) {
        exportedFile[key] = value;
      }

      const overlayKey = key.split(' - ')?.[0];
      if (overlayKey === CHARACTER_ENCODING || overlayKey === FORMAT || overlayKey === CONFORMANCE || overlayKey === ENTRY_CODE || overlayKey === UNIT) {
        if (value) {
          overlays[overlayKey] = value;
        }
      } else if (overlayKey === META || overlayKey === LABEL || overlayKey === INFORMATION || overlayKey === ENTRY) {
        if (value && overlayKey in overlays) {
          overlays[overlayKey].push(value);
        } else if (value) {
          overlays[overlayKey] = [value];
        }
      }

      exportedFile["overlays"] = overlays;
    });
    return exportedFile;
  };

  const preparedZipToExport = () => {
    const exportedFile = [];
    const rootDigest = "ABCDE";
    const metaJSON = {
      files: {
        [rootDigest]: {}
      },
      // TODO: add this later
      root: rootDigest
    };
    data.forEach(item => {
      const key = item.key;
      let value = null;
      if ((item.ocaFile1Checked && key in selectedOverlaysOCAFile1) || item.same) {
        value = selectedOverlaysOCAFile1[key];
      } else if (item.ocaFile2Checked && key in selectedOverlaysOCAFile2) {
        value = selectedOverlaysOCAFile2[key];
      }
      if (key === CHARACTER_ENCODING) {
        exportedFile.push(value);
        metaJSON["files"][rootDigest][CHARACTER_ENCODING] = value?.digest;
      } else if (key === CONFORMANCE) {
        exportedFile.push(value);
        metaJSON["files"][rootDigest][CONFORMANCE] = value?.digest;
      } else if (key === UNIT) {
        exportedFile.push(value);
        metaJSON["files"][rootDigest][UNIT] = value?.digest;
      } else if (key.includes(INFORMATION) || key.includes(LABEL) || key.includes(META)) {
        exportedFile.push(value);
        const splitKey = key.split(' - ');
        let newKey;
        if (splitKey.length > 1) {
          newKey = `${splitKey[0]} (${splitKey[1]})`;
        } else {
          newKey = splitKey[0];
        }
        metaJSON["files"][rootDigest][newKey] = value?.digest;
      }
    });
    exportedFile.push(metaJSON);
    return exportedFile;
  };

  const handleExport = () => {
    let exportedFile;
    if (OCAFile1Raw[0].path.includes(".json") || OCAFile2Raw[0].path.includes(".json")) {
      exportedFile = preparedJSONToExport();
      exportToJsonFile(exportedFile);
    } else {
      exportedFile = preparedZipToExport();
      exportZipFile(exportedFile);
    }
  };

  const exportZipFile = async (data) => {
    const zip = new JSZip();

    for (const item of data) {
      if (item && 'root' in item) {
        zip.file('meta.json', JSON.stringify(item, null, 2));
      } else if (item) {
        zip.file(`${item?.digest}.json`, JSON.stringify(item, null, 2));
      }
    }

    const content = await zip.generateAsync({ type: "blob" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "data.zip";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  const exportToJsonFile = (data) => {
    const jsonString = JSON.stringify(data);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = 'exportedFile.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const compareValues = (key) => {
    const splitKey = key.split(' - ')?.[0];
    if (key.includes(META)) {
      const value1 = selectedOverlaysOCAFile1[key];
      const value2 = selectedOverlaysOCAFile2[key];
      return value1?.description === value2?.description && value1?.name === value2?.name;
    } else {
      let objKey = findComparisonObject(splitKey);
      const value1 = selectedOverlaysOCAFile1[key]?.[objKey];
      const value2 = selectedOverlaysOCAFile2[key]?.[objKey];
      return JSON.stringify(value1) === JSON.stringify(value2);
    }
  };

  useEffect(() => {
    const keysObj1 = Object.keys(selectedOverlaysOCAFile1);
    const keysObj2 = Object.keys(selectedOverlaysOCAFile2);
    const uniqueKeys = [...new Set([...keysObj1, ...keysObj2])];
    const temp = [];

    const combinedList = uniqueKeys.reduce((acc, key) => {
      if (!temp?.includes(key.toLowerCase())) {
        temp.push(key.toLowerCase());
        const same = keysObj1.includes(key) && keysObj2.includes(key) ? compareValues(key) : false;
        const checkIfKeyInListObj1 = checkIfKeyInList(key, keysObj1);
        const newEntry = {
          key: key,
          ocafile1: checkIfKeyInListObj1 ? key : "NONE",
          ocafile2: checkIfKeyInList(key, keysObj2) ? key : "NONE",
        };
        if (same) {
          newEntry['same'] = true;
        } else {
          newEntry['ocaFile1Checked'] = false;
          newEntry['ocaFile2Checked'] = false;
        }
        acc.push(newEntry);
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
      {showDifference && <MergeDifferenceModal setShowCard={setShowDifference} dataDifference={dataDifference} />}
      <Box sx={{
        display: "flex",
        justifyContent: "flex-end",
        width: '100%',
        marginBottom: '1rem',
      }}>
        <Button
          color="button"
          variant="contained"
          onClick={() => handleExport()}
          sx={{
            alignSelf: "flex-end",
            width: "12rem",
            display: "flex",
            justifyContent: "space-around",
            p: 1,
          }}
        // disabled={exportDisabled}
        >
          {t('Finish and Export')} <CheckCircleIcon />
        </Button>
      </Box>
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
              <Typography sx={{ fontWeight: item?.ocafile1 === "NONE" ? '500' : 'normal', cursor: 'pointer' }} onClick={() => processComparisonForDifference(item)}>{item?.ocafile1}</Typography>
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
                    sx={{
                      '&.Mui-checked': {
                        color: CustomPalette.PRIMARY,
                      },
                    }}
                    checked={item?.ocaFile1Checked}
                    onClick={() => handleChange(index, 'ocaFile1Checked')}
                    disabled={item?.ocafile1 === "NONE" || item?.ocaFile1Checked === undefined}
                  />
                </ListItem>
                <ListItem sx={{ background: CustomPalette.GREY_300 }}>
                  <Checkbox
                    sx={{
                      '&.Mui-checked': {
                        color: CustomPalette.PRIMARY,
                      },
                    }}
                    checked={item?.same}
                    onClick={() => handleChange(index, 'same')}
                    disabled={item?.ocaFile1Checked !== undefined || item?.ocaFile2Checked !== undefined}
                  />
                </ListItem>
                <ListItem>
                  <Checkbox
                    sx={{
                      '&.Mui-checked': {
                        color: CustomPalette.PRIMARY,
                      },
                    }}
                    checked={item?.ocaFile2Checked}
                    onClick={() => handleChange(index, 'ocaFile2Checked')}
                    disabled={item?.ocafile2 === "NONE" || item?.ocaFile2Checked === undefined}
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
              <Typography sx={{ fontWeight: item?.ocafile2 === "NONE" ? '500' : 'normal', cursor: 'pointer' }} onClick={() => processComparisonForDifference(item)}>{item?.ocafile2}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box >
  );
};

export default UserSelection;