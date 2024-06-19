import { Box, Button } from "@mui/material";
import React, { useCallback, useContext, useMemo, useRef, useState } from "react";
import { Context } from "../App";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-balham.css";
import useCharacterEncodingType, { CharacterEncodingTypeRenderer } from "./useCharacterEncodingType";
import BackNextSkeleton from "../components/BackNextSkeleton";
import CellHeader from "../components/CellHeader";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import { CustomPalette } from "../constants/customPalette";
import DeleteConfirmation from "./DeleteConfirmation";
import Loading from "../components/Loading";
import { useTranslation } from "react-i18next";

const CharacterEncoding = () => {
  const { t } = useTranslation();
  const {
    characterEncodingRowData,
    setCurrentPage,
    setSelectedOverlay,
    setCharacterEncodingRowData,
    setOverlay,
  } = useContext(Context);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const gridRef = useRef();
  const { handleSave, applyAllFunc } = useCharacterEncodingType(gridRef);

  const columnDefs = useMemo(() => {
    return [
      {
        field: "Attribute",
        editable: false,
        width: 180,
        autoHeight: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: () => <CellHeader headerText={t("Attributes")} helpText='This is the name for the attribute and, for example, will be the column header in every tabular data set no matter what language.' />,
      },
      {
        field: "Character Encoding",
        headerComponent: () => <CellHeader headerText={t("Character Encoding")} helpText='Character encoding of the data for each attribute. Sometimes data is encoded in a specific character encoding which can be recorded here.' />,
        cellRenderer: CharacterEncodingTypeRenderer,
        cellRendererParams: (params) => ({
          attr: params.data.Attribute,
        }),
        width: 200,
      },
    ];
  }, [t]);

  const handleForward = useCallback(() => {
    handleSave();
    setSelectedOverlay('');
    setCurrentPage('Overlays');
  }, [handleSave, setCurrentPage, setSelectedOverlay]);

  const handleDeleteCurrentOverlay = useCallback(() => {
    setOverlay((prev) => ({
      ...prev,
      "Character Encoding": {
        ...prev["Character Encoding"],
        selected: false,
      },
    }));

    // Delete attribute from characterEncodingRowData
    const newCharacterEncodingRowData = characterEncodingRowData.map((row) => {
      delete row['Character Encoding'];
      return row;
    });
    setCharacterEncodingRowData(newCharacterEncodingRowData);
    setSelectedOverlay('');
    setCurrentPage('Overlays');
  }, [characterEncodingRowData, setCharacterEncodingRowData, setCurrentPage, setOverlay, setSelectedOverlay]);

  const onGridReady = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <BackNextSkeleton isForward pageForward={handleForward} isBack pageBack={() => setShowDeleteConfirmation(true)} backText="Remove overlay">
      {loading && characterEncodingRowData?.length > 40 && <Loading />}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={handleDeleteCurrentOverlay}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box
        sx={{
          margin: "2rem",
          gap: "3rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box style={{ display: "flex" }}>
          <Box className="ag-theme-balham" sx={{ width: 380 }}>
            <style>{gridStyles}</style>
            <AgGridReact
              ref={gridRef}
              rowData={characterEncodingRowData}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              onGridReady={onGridReady}
            />
          </Box>
          <Box
            sx={{
              width: 70,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <Box sx={{ height: "2.2rem" }} key={0}></Box>
            <Button
              color="navButton"
              sx={{
                ml: 1,
                width: '130px',
                height: "1.7rem",
                color: CustomPalette.PRIMARY,
              }}
              onClick={applyAllFunc}
            >
              {t('Apply All')}
            </Button>
          </Box>
        </Box>
      </Box>
    </BackNextSkeleton>
  );
};

export default CharacterEncoding;