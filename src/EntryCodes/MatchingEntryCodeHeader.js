import React, { forwardRef, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { BETWEEN_SECTION_SPACING } from '../constants/constants';
import { Context } from '../App';
import { useMultiSchema } from '../schema/schemaContext';
import { langCodeOCAFromName, LanguageConstants } from '../utils/languageUtils';
import { Box, MenuItem } from '@mui/material';
import { gridStyles } from '../constants/styles';
import { AgGridReact } from '../components/AgGridReact';
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
  const { setCurrentPage, entryCodeHeaders, tempEntryCodeRowData, chosenEntryCodeIndex } = useContext(Context);
  
  // Use MultiSchemaContext for schema-specific data
  const { getSchema, updateSchema } = useMultiSchema();
  const schemaState = getSchema();
  const attributeRowData = schemaState?.attributes || [];
  
  // Get schema-specific languages (not global)
  const languages = schemaState?.metadata?.languages || [LanguageConstants.DEFAULT_LANG_NAME];
  
  // Get the attribute name for the chosen index
  const listAttributes = attributeRowData.filter(attr => attr.List === true);
  const targetAttributeName = listAttributes[chosenEntryCodeIndex]?.Attribute;
  
  const [matchingEntryCodes, setMatchingEntryCodes] = useState([]);
  const gridRef = useRef();

  const handleSave = () => {
    const newLanguages = ["Code", ...languages];
    const currentData = gridRef.current.api.getRenderedNodes()?.map(node => node?.data);
    const assignedData = [];
    const matchingEntryCodeMap = {};
    for (const ec of currentData) {
      matchingEntryCodeMap[ec.matchingDataHeader] = ec.matchingDataHeader in matchingEntryCodeMap ? [...matchingEntryCodeMap[ec.matchingDataHeader], ec.lang] : [ec.lang];
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
          for (const lang of matchingEntryCodeMap[assign]) {
            // Keep language names as-is for internal storage
            // CodeGrid expects language names ("English", "French"), not OCA codes
            newRow[lang] = row[assign];
          }
        }
        // Ensure all languages have a key (using OCA codes)
        for (const lang of newLanguages) {
          if (!(lang in newRow)) {
            newRow[lang] = '';
          }
        }
        newRowData.push(newRow);
      }
    }
    
    // Save to MultiSchemaContext using attribute name as key
    if (targetAttributeName) {
      const currentEntryCodes = schemaState?.entryCodes || {};
      updateSchema({
        entryCodes: {
          ...currentEntryCodes,
          [targetAttributeName]: newRowData
        }
      });
    }
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
    params.node.updateData({
      ...params.node.data,
      matchingDataHeader: e.target.value,
    });
  }, []);

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
        marginTop: 2,
        flex: 1,
        mb: BETWEEN_SECTION_SPACING,
      }}>
        <div className="matching-entry-code-grid ag-theme-balham" style={{ width: '400px' }}>
          <style>{`.matching-entry-code-grid.ag-theme-balham{height:min(70vh,560px);min-height:120px}.matching-entry-code-grid .ag-root-wrapper{height:100%}`}</style>
          <style>{gridStyles}</style>
          <AgGridReact
            ref={gridRef}
            style={{ width: "100%", height: "100%" }}
            rowData={matchingEntryCodes}
            columnDefs={columnDefs}
          />
        </div>
      </Box>

    </>
  );
};

export default MatchingEntryCodeHeader;