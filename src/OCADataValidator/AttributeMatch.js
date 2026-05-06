import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { AgGridReact } from "../components/AgGridReact";
import { Box, List, ListItem, ListItemText, MenuItem, Typography } from "@mui/material";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { BETWEEN_SECTION_SPACING } from "../constants/constants";
import { Context } from "../App";
import Languages from "./Languages";
import { greyCellStyle, gridStyles, AG_GRID_DROPDOWN_CELL_CLASS } from "../constants/styles";
import { DropdownMenuList } from "../components/DropdownMenuCell";
import { CustomPalette } from "../constants/customPalette";
import { useMultiSchema } from "../schema/schemaContext";
import { langNameFromTwoLetters, getUILangName, LanguageConstants } from "../utils/languageUtils";

export const DataHeaderRenderer = memo((props) => {
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
    props.changeDataFromTable({ target: { value: "" } });
    setIsDropdownOpen(false);
  };

  const datasetOptions =
    props?.dataHeaders?.length > 0
      ? props?.dataHeaders.map((value) => (
          <MenuItem
            key={value}
            value={value}
            sx={{ border: "none", height: "2rem", fontSize: "small" }}
            onClick={handleChange}
            onDoubleClick={handleDoubleClick}
          >
            {value}
          </MenuItem>
        ))
      : [];

  const typesDisplay = [
    <MenuItem
      key="blank"
      value=""
      sx={{ border: "none", height: "2rem", fontSize: "small" }}
    >
      {/* eslint-disable-next-line react/jsx-curly-brace-presence */}
      {""}
    </MenuItem>,
    ...datasetOptions
  ];

  return props?.dataHeaders.length > 0 ? (
    <DropdownMenuList
      handleKeyDown={handleKeyDown}
      type={props.node.data.Dataset}
      handleChange={handleChange}
      handleClick={handleClick}
      isDropdownOpen={isDropdownOpen}
      setIsDropdownOpen={setIsDropdownOpen}
      typesDisplay={typesDisplay}
    />
  ) : null;
});

const AttributeMatch = () => {
  const { t } = useTranslation();
  const {
    setCurrentDataValidatorPage,
    matchingRowData,
    setMatchingRowData,
    schemaDataConformantHeader,
    firstTimeMatchingRef,
    setSchemaDataConformantRowData,
    setSchemaDataConformantHeader,
    ogSchemaDataConformantHeaderRef,
    notToVerifyAttributes,
    setNotToVerifyAttributes
  } = useContext(Context);

  const { getLanguages, getAttributesList, getSchema, schemaStates, currentSchemaId, ocaPackage } =
    useMultiSchema();
  const _rawLanguages = getLanguages();
  const languages = Array.isArray(_rawLanguages) && _rawLanguages.length ? _rawLanguages : [LanguageConstants.DEFAULT_LANG_NAME];

  const attributeSignature = useMemo(() => {
    const names = getAttributesList();
    return Array.isArray(names) ? names.join("\0") : "";
  }, [schemaStates, currentSchemaId, ocaPackage]);

  const [type, setType] = useState(() => {
    const siteLanguage = getUILangName();
    const langNames = Array.isArray(languages) && languages.length ? languages : [LanguageConstants.DEFAULT_LANG_NAME];
    const chosen =
      siteLanguage === "English"
        ? langNames[0]
        : langNames.find((language) => language.includes(siteLanguage)) || langNames[0];
    return chosen || LanguageConstants.DEFAULT_LANG_NAME;
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [columnDefs, setColumnDefs] = useState([]);
  const gridRef = useRef();

  const handleChange = useCallback((e) => {
    setType(e.target.value);
    setIsDropdownOpen(false);
  }, []);

  const changeDataFromTable = useCallback(
    (e, params) => {
      firstTimeMatchingRef.current = false;
      let saveNode;

      if (e.target.value !== 0) {
        if (gridRef.current?.api?.rowModel?.rowsToDisplay) {
          for (const node of gridRef.current.api.rowModel.rowsToDisplay) {
            if (node.data.Dataset === e.target.value) {
              saveNode = node;
              node.data.Dataset = "";
              break;
            }
          }
        }
      }
      params.node.updateData({
        ...params.node.data,
        Dataset: e.target.value === 0 ? "" : e.target.value
      });
      gridRef.current?.api?.redrawRows({ rowNodes: [saveNode, params.node] });

      setMatchingRowData(
        gridRef.current?.api?.getRenderedNodes()?.map((node) => node?.data)
      );

      const currentData = gridRef.current?.api?.rowModel?.rowsToDisplay.map(
        (node) => node.data.Dataset
      );
      currentData.push(e.target.value);
      const unassignedVariables = ogSchemaDataConformantHeaderRef.current.filter(
        (item) => !currentData.includes(item)
      );
      setNotToVerifyAttributes(unassignedVariables);
    },
    [gridRef, setNotToVerifyAttributes, setMatchingRowData]
  );

  const handleSavePage = useCallback(() => {
    const data = gridRef.current?.api?.getRenderedNodes()?.map((node) => node?.data);

    // mapping from attribute to dataset
    const mappingFromAttrToDataset = {};
    for (const node of data) {
      mappingFromAttrToDataset[node.Dataset] = node.Attribute;
    }

    setMatchingRowData(data);
    setSchemaDataConformantRowData((prev) => {
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
    setSchemaDataConformantHeader(
      ogSchemaDataConformantHeaderRef.current.map(
        (header) => mappingFromAttrToDataset[header] || header
      )
    );
    setCurrentDataValidatorPage("OCADataValidatorCheck");
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

  // Change selected language when site language changes
  useEffect(() => {
    const siteLanguage = getUILangName();
    const langNames = Array.isArray(languages) && languages.length ? languages : [LanguageConstants.DEFAULT_LANG_NAME];
    const newType =
      siteLanguage === "English"
        ? (langNames[0] || LanguageConstants.DEFAULT_LANG_NAME)
        : (langNames.find((language) => language.includes(siteLanguage)) || langNames[0] || LanguageConstants.DEFAULT_LANG_NAME);
    setType(newType);
  }, [i18next.language, languages]);

  useEffect(() => {
    if (ogSchemaDataConformantHeaderRef.current.length === 0) {
      ogSchemaDataConformantHeaderRef.current = schemaDataConformantHeader;
    }

    const unassignedVariables = [...ogSchemaDataConformantHeaderRef.current];
    if (firstTimeMatchingRef.current) {
      if (matchingRowData && matchingRowData?.length > 0) {
        const newMatchingRowData = matchingRowData.map((node) => {
          const index = matchingFunction(unassignedVariables, node.Attribute);
          const DatasetVal = index !== -1 ? unassignedVariables[index] : "";
          if (index !== -1) unassignedVariables.splice(index, 1);
          return { ...node, Dataset: DatasetVal };
        });
        setMatchingRowData(newMatchingRowData);
      } else {
        const attributeNames = Array.isArray(getAttributesList()) ? getAttributesList() : [];
        if (attributeNames.length > 0) {
          const schema = getSchema();
          const lanAttributeRowData = schema?.lanAttributeRowData || {};
          const langLabelArray = lanAttributeRowData[type] || [];
          const labelMap = {};
          langLabelArray.forEach((l) => {
            labelMap[l.Attribute] = l.Label || "";
          });

          const newMatchingRowData = attributeNames.map((attr) => {
            const index = matchingFunction(unassignedVariables, attr);
            const datasetMatch = index !== -1 ? unassignedVariables[index] : "";
            if (index !== -1) unassignedVariables.splice(index, 1);
            return {
              Attribute: attr,
              [type]: labelMap[attr] || "",
              Dataset: datasetMatch
            };
          });

          setMatchingRowData(newMatchingRowData);
        }
      }
    } else {
      for (const node of matchingRowData) {
        const index = unassignedVariables.indexOf(node.Dataset);
        if (index !== -1) {
          unassignedVariables.splice(index, 1);
        }
      }
    }

    setNotToVerifyAttributes(unassignedVariables);
  }, [schemaDataConformantHeader, attributeSignature, type, matchingFunction]);

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
            cellStyle: () => greyCellStyle
          },
          {
            headerName: t("Label"),
            field: type,
            resizable: true,
            flex: 1,
            cellStyle: () => greyCellStyle
          }
        ]
      },
      {
        headerName: t("Dataset File"),
        children: [
          {
            headerName: t("Dataset"),
            field: "Dataset",
            cellClass: AG_GRID_DROPDOWN_CELL_CLASS,
            cellRendererFramework: DataHeaderRenderer,
            cellRendererParams: (params) => ({
              dataHeaders: ogSchemaDataConformantHeaderRef.current,
              changeDataFromTable: (e) => changeDataFromTable(e, params)
            }),
            resizable: true,
            flex: 1
          }
        ]
      }
    ];
    setColumnDefs(columnDefs);
  }, [type, t]);

  // helper that checks if all attributes are matched to their respective datasets and disables the forward button if not
  // const areAllColumnsMatched = useCallback(
  //   () =>
  //     matchingRowData.length > 0 &&
  //     matchingRowData.every((row) => row.Dataset && row.Dataset !== ""),
  //   [matchingRowData]
  // );

  return (
    <>
      <BackNextSkeleton
        isBack
        pageBack={() => {
          setMatchingRowData(
            gridRef.current?.api?.getRenderedNodes()?.map((node) => node?.data)
          );
          setCurrentDataValidatorPage("DatasetViewDataValidator");
        }}
        isForward
        pageForward={handleSavePage}
        middleText={t("You must match your dataset columns (variables) to the attributes in your schema. The verifier attempts to match names automatically. If there are mismatches or unassigned matches you can correct that here.")}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          marginTop: "20px",
          mb: BETWEEN_SECTION_SPACING
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            width: "100%"
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              padding: "1% 5%",
              width: "70%"
            }}
          >
            <Languages
              type={type}
              handleChange={handleChange}
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              languages={languages}
            />
            <Box sx={{ marginTop: "20px" }}>
              <div className="ag-theme-balham" style={{ width: "100%" }}>
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
          <Box
            sx={{
              marginTop: "50px",
              display: "flex",
              flexDirection: "column",
              padding: "1% 5%",
              width: "20%",
              height: "100%",
              position: "sticky",
              top: "0",
              backgroundColor: "white",
              zIndex: 1
            }}
          >
            {/* Updated to create a box around the header */}
            <Box
              sx={{
                padding: "10px",
                border: `2px solid ${CustomPalette.GREY_300}`,
                backgroundColor: CustomPalette.GREY_200
              }}
            >
              <Typography>{t("Unassigned Variables")}</Typography>
            </Box>
            <Box
              sx={{
                padding: "10px",
                borderBottom: `2px solid ${CustomPalette.GREY_300}`,
                borderLeft: `2px solid ${CustomPalette.GREY_300}`,
                borderRight: `2px solid ${CustomPalette.GREY_300}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <List>
                {notToVerifyAttributes.map((item) => (
                  <ListItem key={item}>
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
