import React, { useState, useRef, useEffect, useContext, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { Context } from "../App";
import { greyCellStyle } from "../constants/styles";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { getListOfSelectedOverlays } from "../constants/getListOfSelectedOverlays";
import CellHeader from "../components/CellHeader";
import { useTranslation } from "react-i18next";

const gridStyles = `
.ag-cell {
  line-height: 1.5
}

.ag-header-cell-label {
  display: flex;
  justify-content: center;
  align-items: center;
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
        },
        {
          field: "Flagged",
          width: 78,
          headerComponent: () => <CellHeader headerText={t('Sensitive')} />,
          cellRenderer: CheckboxRenderer,
        },
        {
          field: "Unit",
          headerName: t("Unit"),
          width: 90,
          autoHeight: true,
        },
        {
          field: "Type",
          headerName: t("Type"),
          autoHeight: true,
        },
        {
          field: "Label",
          autoHeight: true,
          width: 170,
          headerComponent: () => <CellHeader headerText={t("Label")} constraint='max 50 chars' />

        },
        {
          field: "Description",
          flex: 1,
          minWidth: 350,
          autoHeight: true,
          headerComponent: () => <CellHeader headerText={t('Description')} constraint={t('max 200 chars')} />
        },
        {
          field: "List",
          headerName: t("List"),
          width: 173,
          autoHeight: true,
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