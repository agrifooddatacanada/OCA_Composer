import React, { forwardRef, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { Context } from '../App';
import { Box, MenuItem } from '@mui/material';
import { gridStyles } from '../constants/styles';
import { AgGridReact } from 'ag-grid-react';
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

const MatchingEntryCodeHeader = () => {
  const { setCurrentPage, entryCodeHeaders, languages, tempEntryCodeRowData, chosenEntryCodeIndex, setEntryCodeRowData } = useContext(Context);
  const [matchingEntryCodes, setMatchingEntryCodes] = useState([]);
  const gridRef = useRef();

  const handleSave = () => {
    const newLanguages = ["Code", ...languages];
    const currentData = gridRef.current.api.getRenderedNodes()?.map(node => node?.data);
    const assignedData = [];
    const matchingEntryCodeMap = {};
    for (const ec of currentData) {
      matchingEntryCodeMap[ec.matchingDataHeader] = ec.lang;
      if (ec?.matchingDataHeader !== '') {
        assignedData.push(ec.matchingDataHeader);
      }
    }
    const newRowData = [];

    for (const row of tempEntryCodeRowData) {
      let hasItem = false;
      for (const assign of assignedData) {
        if (assign in row && row[assign] !== '') {
          hasItem = true;
          break;
        }
      }
      if (hasItem) {
        const newRow = {};
        for (const assign of assignedData) {
          newRow[matchingEntryCodeMap[assign]] = row[assign];
        }
        for (const lang of newLanguages) {
          if (!(lang in newRow)) {
            newRow[lang] = '';
          }
        }
        newRowData.push(newRow);
      }
    }
    setEntryCodeRowData(prev => {
      const newEntryCodeRowData = [...prev];
      newEntryCodeRowData[chosenEntryCodeIndex] = newRowData;
      return newEntryCodeRowData;
    });
    setCurrentPage('Codes');
  };

  const columnDefs = useMemo(() => {
    return [
      {
        headerName: 'Items',
        field: 'lang',
        width: 200,
        editable: false,
      },
      {
        headerName: 'Data Header',
        field: 'matchingDataHeader',
        width: 200,
        cellRendererFramework: DataHeaderRenderer,
        cellRendererParams: (params) => ({
          dataHeaders: ['', ...entryCodeHeaders],
          onRefresh: () => {
            gridRef.current?.api?.redrawRows({ rowNodes: [params.node] });
          },
          changeDataFromTable: (e) => changeDataFromTable(e, params)
        }),
      }
    ];
  }, []);

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

  useEffect(() => {
    const unassignedVariables = [...entryCodeHeaders];
    const assignedVariables = [];
    const newLanguages = ["Code", ...languages];
    const newMatchingEntryCodes = [];
    for (const lang of newLanguages) {
      const newObj = {};
      newObj['lang'] = lang;
      const index = matchingFunction(unassignedVariables, lang);
      newObj['matchingDataHeader'] = index !== -1 ? unassignedVariables[index] : '';
      newMatchingEntryCodes.push(newObj);
      if (index !== -1) {
        assignedVariables.push(unassignedVariables[index]);
        unassignedVariables.splice(index, 1);
      }
    }
    setMatchingEntryCodes(newMatchingEntryCodes);
  }, [entryCodeHeaders, languages, matchingFunction]);

  return (
    <>
      <BackNextSkeleton
        isBack
        pageBack={() => setCurrentPage('UploadEntryCodes')}
        isForward
        pageForward={handleSave} />
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}>
        <div className="ag-theme-balham" style={{ width: '400px' }}>
          <style>{gridStyles}</style>
          <AgGridReact
            ref={gridRef}
            rowData={matchingEntryCodes}
            columnDefs={columnDefs}
            domLayout="autoHeight"
          />
        </div>
      </Box>

    </>
  );
};

export default MatchingEntryCodeHeader;