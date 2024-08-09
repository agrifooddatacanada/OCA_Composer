import { forwardRef, memo, useCallback, useContext, useEffect, useRef, useState } from "react";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { Context } from "../App";
import { Box, List, ListItem, ListItemText, MenuItem, Typography } from "@mui/material";
import Languages from "./Languages";
import { greyCellStyle, gridStyles } from "../constants/styles";
import { AgGridReact } from "ag-grid-react";
import { DropdownMenuList } from "../components/DropdownMenuCell";
import { CustomPalette } from "../constants/customPalette";
import { useTranslation } from "react-i18next";
import { set } from "react-ga";

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

    const handleDoubleClick = () => {
      props.changeDataFromTable({ target: { value: '' } });
      setIsDropdownOpen(false);
    };

    const typesDisplay = props?.dataHeaders.map((value, index) => (
      <MenuItem
        key={index + "_" + value}
        value={value}
        sx={{ border: "none", height: "2rem", fontSize: "small" }}
        onClick={handleChange}
        onDoubleClick={handleDoubleClick}
      >
        {value}
      </MenuItem>
    ));

    return (
      <>
        {props?.dataHeaders.length > 0 ? (
          <DropdownMenuList
            handleKeyDown={handleKeyDown}
            type={props.node.data.Dataset}
            handleChange={handleChange}
            handleClick={handleClick}
            isDropdownOpen={isDropdownOpen}
            setIsDropdownOpen={setIsDropdownOpen}
            typesDisplay={typesDisplay}
          />
        ) : (
          <></>
        )}
      </>
    );
  })
);

const AttributeMatch = () => {
  const { t } = useTranslation();
  const {
    setCurrentDataValidatorPage,
    languages, matchingRowData,
    setMatchingRowData,
    schemaDataConformantHeader,
    firstTimeMatchingRef,
    setSchemaDataConformantRowData,
    setSchemaDataConformantHeader,
    ogSchemaDataConformantHeaderRef,
    notToVerifyAttributes, setNotToVerifyAttributes
  } = useContext(Context);

  const [type, setType] = useState(languages[0] || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [columnDefs, setColumnDefs] = useState([]);
  const gridRef = useRef();

  const handleChange = useCallback((e) => {
    setType(e.target.value);
    setIsDropdownOpen(false);
  }, []);

  const changeDataFromTable = useCallback((e, params) => {
    firstTimeMatchingRef.current = false;
    let saveNode = undefined;

    for (const node of gridRef.current?.api?.rowModel?.rowsToDisplay) {
      if (node.data.Dataset === e.target.value) {
        saveNode = node;
        node.data.Dataset = '';
        break;
      }
    }
    params.node.updateData({
      ...params.node.data,
      Dataset: e.target.value,
    });
    gridRef.current?.api?.redrawRows({ rowNodes: [saveNode, params.node] });

    const currentData = gridRef.current?.api?.rowModel?.rowsToDisplay.map((node) => node.data.Dataset);
    currentData.push(e.target.value);
    const unassignedVariables = ogSchemaDataConformantHeaderRef.current.filter((item) => !currentData.includes(item));
    setNotToVerifyAttributes(unassignedVariables);
  }, [gridRef, setNotToVerifyAttributes]);

  const handleSavePage = useCallback(() => {
    const data = gridRef.current?.api?.getRenderedNodes()?.map((node) => node?.data);

    const mappingFromAttrToDataset = {};
    for (const node of data) {
      mappingFromAttrToDataset[node['Dataset']] = node['Attribute'];
    }

    setMatchingRowData(data);
    setSchemaDataConformantRowData(prev => {
      const newData = [];
      for (const node of prev) {
        const newRow = {};
        for (const [key, value] of Object.entries(node)) {
          if (key in mappingFromAttrToDataset) {
            newRow[mappingFromAttrToDataset[key]] = value;
          } else {
            newRow[key] = value;
          }
        }
        newData.push(newRow);
      }

      return newData;
    });
    setSchemaDataConformantHeader(ogSchemaDataConformantHeaderRef.current.map((header) => mappingFromAttrToDataset[header] || header));
    setCurrentDataValidatorPage('OCADataValidatorCheck');
  }, [gridRef, setMatchingRowData, setCurrentDataValidatorPage]);

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
    const unassignedVariables = [...ogSchemaDataConformantHeaderRef.current];
    if (firstTimeMatchingRef.current) {
      let newMatchingRowData = [];
      if (matchingRowData && matchingRowData?.length > 0) {
        for (const node of matchingRowData) {
          const index = matchingFunction(unassignedVariables, node['Attribute']);
          newMatchingRowData.push({
            ...node,
            Dataset: index !== -1 ? unassignedVariables[index] : "",
          });
          if (index !== -1) {
            unassignedVariables.splice(index, 1);
          }
        }
      }

      setMatchingRowData(newMatchingRowData);
    } else {
      for (const node of matchingRowData) {
        const index = unassignedVariables.indexOf(node['Dataset']);
        if (index !== -1) {
          unassignedVariables.splice(index, 1);
        }
      }
    }
    setNotToVerifyAttributes(unassignedVariables);
  }, [schemaDataConformantHeader]);

  useEffect(() => {
    const columnDefs = [
      {
        headerName: t("Schema Bundle"),
        children: [
          {
            headerName: t("Attribute"),
            field: "Attribute",
            resizable: true,
            flex: 1,
            cellStyle: () => greyCellStyle,
          },
          {
            headerName: t("Label"),
            field: type,
            resizable: true,
            flex: 1,
            cellStyle: () => greyCellStyle,
          },
        ]
      },
      {
        headerName: t("Dataset File"),
        children: [
          {
            headerName: t("Dataset"),
            field: "Dataset",
            cellRendererFramework: DataHeaderRenderer,
            cellRendererParams: (params) => ({
              dataHeaders: ogSchemaDataConformantHeaderRef.current,
              changeDataFromTable: (e) => changeDataFromTable(e, params)
            }),
            resizable: true,
            flex: 1,
          },
        ]
      },

    ];
    setColumnDefs(columnDefs);
  }, [type, t]);

  return (
    <>
      <BackNextSkeleton
        isBack pageBack={() => {
          setMatchingRowData(gridRef.current?.api?.getRenderedNodes()?.map((node) => node?.data));
          setCurrentDataValidatorPage('StartDataValidator');
        }}
        isForward
        pageForward={handleSavePage}
        middleText="You must match your dataset columns (variables) to the attributes in your schema. The verifier attempts to match names automatically. If there are mismatches or unassigned matches you can correct that here."
      />
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        marginTop: '20px',
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            padding: '1% 5%',
            width: '70%',
          }}>
            <Languages type={type} handleChange={handleChange} isDropdownOpen={isDropdownOpen} setIsDropdownOpen={setIsDropdownOpen} languages={languages} />
            <Box sx={{ marginTop: '20px' }}>
              <div className="ag-theme-balham" style={{ width: '100%' }}>
                <style>{gridStyles}</style>
                <AgGridReact
                  ref={gridRef}
                  rowData={matchingRowData}
                  columnDefs={columnDefs}
                  domLayout="autoHeight"
                />
              </div>
            </Box>
          </Box>
          <Box sx={{
            marginTop: '50px',
            display: 'flex',
            flexDirection: 'column',
            padding: '1% 5%',
            width: '20%',
            height: '100%',
            position: 'sticky',
            top: '0',
            backgroundColor: 'white',
            zIndex: 1
          }}>
            {/* Updated to create a box around the header */}
            <Box sx={{ padding: '10px', border: `2px solid ${CustomPalette.GREY_300}`, backgroundColor: CustomPalette.GREY_200 }}>
              <Typography>{t('Unassigned Variable')}</Typography>
            </Box>
            <Box sx={{
              padding: '10px',
              borderBottom: `2px solid ${CustomPalette.GREY_300}`,
              borderLeft: `2px solid ${CustomPalette.GREY_300}`,
              borderRight: `2px solid ${CustomPalette.GREY_300}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <List>
                {notToVerifyAttributes.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default AttributeMatch;