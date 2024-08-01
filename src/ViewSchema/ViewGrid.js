import React, { useState, useRef, useEffect, useContext, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { Context } from "../App";
import { greyCellStyle } from "../constants/styles";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { getListOfSelectedOverlays } from "../constants/getListOfSelectedOverlays";
import CellHeader from "../components/CellHeader";
import { useTranslation } from "react-i18next";
import TypeTooltip from "../AttributeDetails/TypeTooltip";

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
          headerComponent: () => <CellHeader headerText={t("Attributes")} helpText='This is the name for the attribute and, for example, will be the column header in every tabular data set no matter what language.' />,
        },
        {
          field: "Flagged",
          width: 98,
          headerComponent: () => <CellHeader
            headerText={t('Sensitive')}
            helpText={
              <>
                <div>
                  {t('If the attribute could be considered Personally Identifiable...')}
                </div>
                <br />
                <div>
                  {t('Examples of PII include names, locations, postal codes...')}
                </div>
              </>
            }
          />,
          cellRenderer: CheckboxRenderer,
        },
        {
          field: "Unit",
          headerName: t("Unit"),
          width: 90,
          autoHeight: true,
          headerComponent: () => <CellHeader headerText={t('Unit')} helpText={t('The units of each attribute (or leave blank if the attribute is...')} />
        },
        {
          field: "Type",
          headerName: t("Type"),
          autoHeight: true,
          headerComponent: () => <CellHeader headerText={t("Type")} helpText={<TypeTooltip />} />
        },
        {
          field: "Label",
          autoHeight: true,
          width: 170,
          headerComponent: () => <CellHeader headerText={t("Label")} constraint='max 50 chars' helpText={t('This is the language specific label for an attribute')} />

        },
        {
          field: "Description",
          flex: 1,
          minWidth: 350,
          autoHeight: true,
          headerComponent: () => <CellHeader headerText={t('Description')} constraint={t('max 200 chars')} helpText={t('This is a language specific description of the attribute...')} />
        },
        {
          field: "List",
          headerName: t("List"),
          width: 173,
          autoHeight: true,
          headerComponent: () => <CellHeader headerText={t("List")} helpText={t("Rather than allow free text entry into a record, you may...")} />
        },
      ];

      const { selectedFeatures } = getListOfSelectedOverlays(overlay);
      selectedFeatures.forEach((feature) => {
        predefinedColumns.push({
          field: feature,
          width: 160,
          autoHeight: true,
          headerComponent: () => {
            return (
              <span style={{ margin: "auto" }}>
                {feature === 'Make selected entries required' ? t('Required Entry') : feature === 'Add format rule for data' ? t("Format Rules") : t(feature)}
              </span>
            );
          },
          cellRenderer: feature === 'Make selected entries required' ? CheckboxRenderer : null,
        });
      });

      return predefinedColumns;
    };

    setColumnDefs(getColumns());
  }, [overlay]);

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
    <div className="ag-theme-balham" style={{ width: '100%' }}>
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