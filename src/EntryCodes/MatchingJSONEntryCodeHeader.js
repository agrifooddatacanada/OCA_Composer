import React, { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useContext } from 'react';
import { Context } from '../App';
import { Box, FormControl, MenuItem, Select, Typography } from '@mui/material';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { AgGridReact } from 'ag-grid-react';
import { gridStyles } from '../constants/styles';
import { DropdownMenuList } from '../components/DropdownMenuCell';

export const DataHeaderRenderer = memo(
  forwardRef((props, ref) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleChange = (e) => {
      props.changeDataFromTable(e);
      setIsDropdownOpen(false);
    };

    const handleClick = () => {
      setIsDropdownOpen(!isDropdownOpen);
    };

    const handleKeyDown = (e) => {
      const keyPressed = e.key;
      if (keyPressed === "Delete" || keyPressed === "Backspace") {
        // typesObjectRef.current[attributeName] = "";
      }
    };

    const typesDisplay = props?.dataHeaders.map((value, index) => {
      return (
        <MenuItem
          key={index + "_" + value}
          value={value}
          sx={{ border: "none", height: "2rem", fontSize: "small" }}
        >
          {value}
        </MenuItem>
      );
    });

    return (
      <>
        {
          props?.dataHeaders.length > 0 ?
            <DropdownMenuList
              handleKeyDown={handleKeyDown}
              type={props.node.data.matchingDataHeader}
              handleChange={handleChange}
              handleClick={handleClick}
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              typesDisplay={typesDisplay}
            /> :
            <></>
        }
      </>
    );
  })
);

const MatchingJSONEntryCodeHeader = () => {
  const { tempEntryCodeSummary, tempEntryList, languages, setCurrentPage, setEntryCodeRowData, chosenEntryCodeIndex, attributeRowData } = useContext(Context);
  const [languageList, setLanguageList] = useState([]);
  const [attributeList, setAttributeList] = useState([]);
  const [matchingLanguages, setMatchingLanguages] = useState([]);
  const [attrValue, setAttrValue] = useState([]);
  const gridRef = useRef();

  const attributeListDropdown = useMemo(() => {
    return attributeList.map((division) => {
      return (
        <MenuItem sx={{ height: '38px' }} key={division} value={division}>{division}</MenuItem>
      );
    });
  }, [attributeList]);

  const changeDataFromTable = useCallback((e, params) => {
    let saveNode = undefined;
    for (const node of gridRef.current?.api?.rowModel?.rowsToDisplay) {
      if (node.data.matchingDataHeader === e.target.value) {
        saveNode = node;
        node.data.matchingDataHeader = '';
        break;
      }
    }
    params.node.updateData({
      ...params.node.data,
      matchingDataHeader: e.target.value,
    });
    gridRef.current?.api?.redrawRows({ rowNodes: [saveNode, params.node] });
  }, [gridRef]);

  const columnDefs = useMemo(() => {
    return [
      {
        headerName: 'Current Languages',
        field: 'lang',
        width: 200,
        editable: false,
      },
      {
        headerName: 'Matching Attributes',
        field: 'matchingDataHeader',
        width: 200,
        cellRendererFramework: DataHeaderRenderer,
        cellRendererParams: (params) => ({
          dataHeaders: languageList,
          onRefresh: () => {
            gridRef.current?.api?.redrawRows({ rowNodes: [params.node] });
          },
          changeDataFromTable: (e) => changeDataFromTable(e, params)
        }),
      }
    ];
  }, [languageList]);

  const handleSave = () => {
    const matchingData = gridRef.current.api.getRenderedNodes()?.map(node => node?.data);
    const entryCodes = tempEntryCodeSummary?.['attribute_entry_codes']?.[attrValue];

    if (entryCodes && entryCodes?.length > 0) {
      const newEntryCodeRowData = [];
      for (const code of entryCodes) {
        const newObj = { Code: code };
        for (const lang of languages) {
          const correspondingHeader = matchingData.find(item => item.lang === lang)?.matchingDataHeader;
          const correspondingEntryCodes = tempEntryList.find(item => item.language === correspondingHeader);
          const value = correspondingEntryCodes?.['attribute_entries']?.[attrValue]?.[code];
          newObj[lang] = value ? value : '';
        }
        newEntryCodeRowData.push(newObj);
      }
      setEntryCodeRowData(prev => {
        const newData = [...prev];
        newData[chosenEntryCodeIndex] = newEntryCodeRowData;
        return newData;
      });
      setCurrentPage('Codes');
    }
  };

  const matchingFunction = useCallback((unassignedVar, attr) => {
    for (let i = 0; i < unassignedVar.length; i++) {
      if (unassignedVar[i].toLowerCase() === attr.toLowerCase()) {
        return i;
      }
    }
    for (let i = 0; i < unassignedVar.length; i++) {
      if (unassignedVar[i].toLowerCase().includes(attr.toLowerCase())) {
        return i;
      }
    }
    return -1;
  }, []);

  useEffect(() => {
    const attrList = Object.keys(tempEntryCodeSummary?.['attribute_entry_codes'] || {});
    const chosenAttribute = attributeRowData.filter(
      (item) => item.List === true
    ).filter((_, index) => index === chosenEntryCodeIndex)?.[0]?.['Attribute'] || '';
    const matchingValues = [];
    const tempLanguagesList = tempEntryList.map((entry) => entry?.language);
    languages.forEach(lang => {
      // const matchingIndex = matchingFunction(tempLanguagesList, lang);
      matchingValues.push({
        lang,
        // matchingDataHeader: matchingIndex !== -1 ? tempLanguagesList[matchingIndex] : ''
        matchingDataHeader: ''
      });
    });
    const matchingIndex = matchingFunction(attrList, chosenAttribute);
    setMatchingLanguages(matchingValues);
    setAttributeList(attrList);
    setAttrValue(matchingIndex !== -1 ? attrList[matchingIndex] : attrList[0]);
    setLanguageList(tempLanguagesList);
  }, []);

  return (
    <>
      <BackNextSkeleton
        isBack
        pageBack={() => {
          setCurrentPage('UploadEntryCodes');
        }}
        isForward={attributeList?.length > 0}
        pageForward={handleSave} />
      {attributeList?.length > 0 ?
        <Box
          sx={{
            // margin: '2rem',
            marginLeft: 11,
            marginTop: 2,
            gap: '3rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <FormControl variant="standard" sx={{ minWidth: 120, width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Typography>Please choose the source attribute to import from: {' '}</Typography>
            <Select
              value={attrValue}
              onChange={(e) => setAttrValue(e.target.value)}
              displayEmpty
              sx={{
                minWidth: '100px'
              }}
            >
              {attributeListDropdown}
            </Select>
          </FormControl>
          <div className="ag-theme-balham" style={{ width: '400px' }}>
            <style>{gridStyles}</style>
            <AgGridReact
              ref={gridRef}
              rowData={matchingLanguages}
              columnDefs={columnDefs}
              domLayout="autoHeight"
            />
          </div>
        </Box> :
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}>
          <Typography variant="h5">No entry codes in this schema</Typography>
        </Box>}
    </>
  );
};

export default MatchingJSONEntryCodeHeader;