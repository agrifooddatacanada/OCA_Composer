import React, { forwardRef, memo, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BackNextSkeleton from '../components/BackNextSkeleton';
import { Context } from '../App';
import { useMultiSchema } from '../schema/schemaContext';
import { LanguageConstants } from '../utils/languageUtils';
import { Box, MenuItem } from '@mui/material';
import {
  gridStyles,
  greyCellStyle,
  matchingEntryCodeGridStyles,
  matchingEntryCodePageBoxSx,
  matchingEntryCodeMenuItemSx,
  matchingEntryCodeSelectHostBoxSx
} from '../constants/styles';
import { AgGridReact } from '../components/AgGridReact';
import { DropdownMenuList } from '../components/DropdownMenuCell';

const INTERNAL_CODE_ROW_KEY = 'Code';

export const DataHeaderRenderer = memo(
  forwardRef((props, ref) => {
    const { t } = useTranslation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const formatImportedColumnLabel = useCallback((value) => {
      if (value === 'en') return t('English');
      if (value === 'fr') return t('French');
      return t(value, { defaultValue: value });
    }, [t]);

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
          sx={matchingEntryCodeMenuItemSx}
        >
          {value === "" ? "" : formatImportedColumnLabel(value)}
        </MenuItem>
      );
    });

    const renderDisplayValue = (value) => {
      if (value === "" || value == null) return "\u200B";
      return formatImportedColumnLabel(value);
    };

    return (
      <>
        {
          props?.dataHeaders.length > 0 ?
            <Box sx={matchingEntryCodeSelectHostBoxSx}>
              <DropdownMenuList
                stretchInCell
                selectChevronPaddingPx={22}
                handleKeyDown={handleKeyDown}
                type={props.node.data.matchingDataHeader}
                handleChange={handleChange}
                handleClick={handleClick}
                isDropdownOpen={isDropdownOpen}
                setIsDropdownOpen={setIsDropdownOpen}
                typesDisplay={typesDisplay}
                renderDisplayValue={renderDisplayValue}
              />
            </Box> :
            <></>
        }
      </>
    );
  })
);

const MatchingEntryCodeHeader = () => {
  const { t } = useTranslation();
  const { setCurrentPage, entryCodeHeaders, tempEntryCodeRowData, chosenEntryCodeIndex } = useContext(Context);
  
  const { getSchema, updateSchema } = useMultiSchema();
  const schemaState = getSchema();
  const attributeRowData = schemaState?.attributes || [];
  
  const languages = schemaState?.metadata?.languages || [LanguageConstants.DEFAULT_LANG_NAME];
  
  const listAttributes = attributeRowData.filter(attr => attr.List === true);
  const targetAttributeName = listAttributes[chosenEntryCodeIndex]?.Attribute;
  
  const gridRef = useRef();

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

  const buildMatchingEntryCodes = useCallback(() => {
    const unassignedVariables = [...entryCodeHeaders];
    const newLanguages = [INTERNAL_CODE_ROW_KEY, ...languages];
    const newMatchingEntryCodes = [];
    for (const lang of newLanguages) {
      const newObj = {};
      newObj.lang = lang;
      const index = matchingFunction(unassignedVariables, lang);
      newObj.matchingDataHeader = index !== -1 ? unassignedVariables[index] : "";
      newMatchingEntryCodes.push(newObj);
      if (index !== -1) {
        unassignedVariables.splice(index, 1);
      }
    }
    return newMatchingEntryCodes;
  }, [entryCodeHeaders, languages, matchingFunction]);

  const [matchingRows, setMatchingRows] = useState(() => buildMatchingEntryCodes());

  useLayoutEffect(() => {
    setMatchingRows(buildMatchingEntryCodes());
  }, [buildMatchingEntryCodes]);

  const handleSave = () => {
    const newLanguages = [INTERNAL_CODE_ROW_KEY, ...languages];
    const currentData = matchingRows;
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
            newRow[lang] = row[assign];
          }
        }
        for (const lang of newLanguages) {
          if (!(lang in newRow)) {
            newRow[lang] = '';
          }
        }
        newRowData.push(newRow);
      }
    }
    
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

  const changeDataFromTable = useCallback((e, params) => {
    const { value } = e.target;
    const langKey = params.node?.data?.lang;
    if (langKey === undefined) return;
    setMatchingRows((prev) =>
      prev.map((row) =>
        row.lang === langKey
          ? { ...row, matchingDataHeader: value }
          : row
      )
    );
  }, []);

  const formatAssignedColumnCell = useCallback(
    (langKey) => {
      if (langKey === INTERNAL_CODE_ROW_KEY) return t("Entry Code");
      return t(langKey, { defaultValue: langKey });
    },
    [t]
  );

  const columnDefs = useMemo(() => {
    return [
      {
        headerName: t("Assigned Column Name"),
        field: 'lang',
        width: 240,
        suppressSizeToFit: true,
        editable: false,
        cellClass: 'matching-entry-code-assigned-cell',
        cellStyle: () => greyCellStyle,
        valueFormatter: (p) => formatAssignedColumnCell(p.value),
      },
      {
        headerName: t("Imported Column Name"),
        field: 'matchingDataHeader',
        width: 240,
        suppressSizeToFit: true,
        cellClass: 'matching-entry-code-data-header-cell',
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
  }, [entryCodeHeaders, changeDataFromTable, t, formatAssignedColumnCell]);

  const [gridLayoutReady, setGridLayoutReady] = useState(false);

  useLayoutEffect(() => {
    setGridLayoutReady(false);
  }, [entryCodeHeaders, languages]);

  const handleGridFirstDataRendered = useCallback(() => {
    setGridLayoutReady(true);
  }, []);

  return (
    <>
      <BackNextSkeleton
        isBack
        pageBack={() => setCurrentPage('UploadEntryCodes')}
        isForward
        pageForward={handleSave}
      />
      <Box sx={matchingEntryCodePageBoxSx}>
        <div className="matching-entry-code-grid matching-entry-code-grid-root ag-theme-balham overlay-grid-suppress-hscroll">
          <style>{`${gridStyles}${matchingEntryCodeGridStyles}`}</style>
          <div
            className={`matching-entry-code-grid--inner${
              gridLayoutReady ? "" : " matching-entry-code-grid--pending"
            }`}
          >
            <AgGridReact
              ref={gridRef}
              style={{ width: "100%" }}
              rowData={matchingRows}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              suppressHorizontalScroll
              onFirstDataRendered={handleGridFirstDataRendered}
            />
          </div>
        </div>
      </Box>

    </>
  );
};

export default MatchingEntryCodeHeader;
