import React, { useState, useRef, useEffect, useContext, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { AgGridReact } from "ag-grid-react";
import { Box, MenuItem } from "@mui/material";
import { Context } from "../App";
import { greyCellStyle } from "../constants/styles";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import getListOfSelectedOverlays from "../constants/getListOfSelectedOverlays";
import CellHeader from "../components/CellHeader";
import TypeTooltip from "../AttributeDetails/TypeTooltip";
import { DropdownMenuList } from "../components/DropdownMenuCell";
import {
  FIELD_RANGE_OVERLAY,
  MAX_ATTR_DESCRIPTION_CHARS,
  MAX_ATTR_LABEL_CHARS
} from "../constants/constants";
import SelectedFeatureHeader from "./SelectedFeatureHeader";

const gridStyles = `
.ag-cell {
  line-height: 1.5
}

.ag-header-cell-label {
  display: flex;
  justify-content: center;
  align-items: center;
}

.ag-body-viewport-wrapper.ag-layout-normal {
  overflow-x: scroll;
  overflow-y: scroll;
}

::-webkit-scrollbar {
  -webkit-appearance: none;
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background-color: rgba(0,0,0,.5);
  box-shadow: 0 0 1px rgba(255,255,255,.5);
}
`;

const defaultColDef = {
  width: 120,
  editable: false,
  cellStyle: () => greyCellStyle
};

const CheckboxRenderer = ({ value }) => {
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current.checked = value;
  }, [value]);

  return <input type="checkbox" ref={inputRef} disabled />;
};

export const ListRenderer = memo((props) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleChange = () => {
    setIsDropdownOpen(false);
  };

  const handleClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const typesDisplay = props.data?.List?.split(" | ").map((value) => (
    <MenuItem
      key={value}
      value={value}
      sx={{ border: "none", height: "2rem", fontSize: "small" }}
    >
      {value}
    </MenuItem>
  ));

  return props.data?.List === "Not a List" ? (
    <Box>Not a List </Box>
  ) : (
    <DropdownMenuList
      handleKeyDown={() => {}}
      type={props.node.data.List.substring(0, 18)}
      handleChange={handleChange}
      handleClick={handleClick}
      isDropdownOpen={isDropdownOpen}
      setIsDropdownOpen={setIsDropdownOpen}
      typesDisplay={typesDisplay}
    />
  );
});

export default function ViewGrid({ displayArray, currentLanguage, setLoading }) {
  const { t } = useTranslation();
  const { overlay, cardinalityData } = useContext(Context);
  const [columnDefs, setColumnDefs] = useState([]);
  const [rowData, setRowData] = useState([]);

  const onGridReady = useCallback(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    const getColumns = () => {
      const predefinedColumns = [
        {
          field: "Attribute",
          headerName: t("Attributes"),
          autoHeight: true,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Attributes"),
            helpText: t("This is the name for the attribute and, for example...")
          }
        },
        {
          field: "Flagged",
          width: 98,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Sensitive"),
            helpText: (
              <>
                <div>
                  {t("If the attribute could be considered Personally Identifiable...")}
                </div>
                <br />
                <div>
                  {t("Examples of PII include names, locations, postal codes...")}
                </div>
              </>
            )
          },
          cellRenderer: CheckboxRenderer
        },
        {
          field: "Unit",
          headerName: t("Unit"),
          width: 90,
          autoHeight: true,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Unit"),
            helpText: t(
              "The units of each attribute (or leave blank if the attribute is..."
            )
          }
        },
        {
          field: "Type",
          headerName: t("Type"),
          autoHeight: true,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Type"),
            helpText: <TypeTooltip />
          }
        },
        {
          field: "Label",
          autoHeight: true,
          width: 170,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Label"),
            constraint: t("max label chars", { maxLabelChars: MAX_ATTR_LABEL_CHARS }),
            helpText: t("This is the language specific label for an attribute")
          }
        },
        {
          field: "Description",
          flex: 1,
          minWidth: 350,
          autoHeight: true,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Description"),
            constraint: t("max description chars", {
              maxDescriptionChars: MAX_ATTR_DESCRIPTION_CHARS
            }),
            helpText: t("This is a language specific description of the attribute...")
          }
        },
        {
          field: "List",
          headerName: t("List"),
          width: 173,
          autoHeight: true,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("List"),
            helpText: t("Rather than allow free text entry into a record, you may...")
          },
          cellRenderer: ListRenderer
        }
      ];

      const { selectedFeatures } = getListOfSelectedOverlays(overlay);
      selectedFeatures.forEach((feature) => {
        if (feature === FIELD_RANGE_OVERLAY) {
          predefinedColumns.push({
            field: "LowerBound",
            width: 130,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Lower Bound"),
              helpText: t("The lower bound of the range")
            }
          });

          predefinedColumns.push({
            field: "LowerInclusive",
            width: 120,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Inclusive"),
              helpText: t("Whether or not the lower bound is included in the range")
            },
            cellRenderer: CheckboxRenderer
          });

          predefinedColumns.push({
            field: "UpperBound",
            width: 130,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Upper Bound"),
              helpText: t("The upper bound of the range")
            }
          });

          predefinedColumns.push({
            field: "UpperInclusive",
            width: 120,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Inclusive"),
              helpText: t("Whether or not the upper bound is included in the range")
            },
            cellRenderer: CheckboxRenderer
          });
        } else {
          predefinedColumns.push({
            field: feature,
            width: 160,
            autoHeight: true,
            headerComponent: SelectedFeatureHeader,
            headerComponentParams: {
              feature
            },
            cellRenderer:
              feature === "Make selected entries required" ? CheckboxRenderer : null
          });
        }
      });

      return predefinedColumns;
    };

    setColumnDefs(getColumns());
  }, [overlay, t]);

  useEffect(() => {
    const newRowData = JSON.parse(JSON.stringify(displayArray));
    const newCardinalityData = JSON.parse(JSON.stringify(cardinalityData));

    newRowData.forEach((item, index) => {
      item.Description = item.Description[currentLanguage];
      item.Label = item.Label[currentLanguage];
      item.List = item.List[currentLanguage];

      if (newCardinalityData[index] && newCardinalityData[index].EntryLimit) {
        item.Cardinality = newCardinalityData[index].EntryLimit;
      }
    });

    setRowData(newRowData);
  }, [displayArray, cardinalityData, currentLanguage]);

  return (
    <div className="ag-theme-balham" style={{ width: "100%" }}>
      <style>{gridStyles}</style>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        domLayout="autoHeight"
        onGridReady={onGridReady}
      />
    </div>
  );
}
