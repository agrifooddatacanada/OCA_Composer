import { Box, Button } from "@mui/material";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "../components/AgGridReact";
import { useTranslation } from "react-i18next";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import "ag-grid-community/styles/ag-theme-balham.css";
import useCharacterEncodingType, {
  CharacterEncodingTypeRenderer
} from "./useCharacterEncodingType";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { BETWEEN_SECTION_SPACING, AG_GRID_VIRTUALIZE_MIN_ROWS } from "../constants/constants";
import CellHeader from "../components/CellHeader";
import { gridStyles, greyCellStyle } from "../constants/styles";
import { CustomPalette } from "../constants/customPalette";
import DeleteConfirmation from "./DeleteConfirmation";
import Loading from "../components/Loading";
import { FIELD_CHARACTER_ENCODING_OVERLAY } from "../constants/constants";
import { useDeleteOverlayHandler } from "../utils/overlayUtils";
import { measureTextHeight } from "../utils/measureTextLines";
import { useOverlayGridOnGridReady } from "./gridUtils";

const CharacterEncoding = () => {
  const { t, i18n } = useTranslation();
  const { setCurrentPage } = useContext(Context);

  const {
    getSchema,
    updateSchema,
    updateOverlaySelection,
    setSelectedOverlay
  } = useMultiSchema();
  const schemaState = getSchema();
  const deleteHandler = useDeleteOverlayHandler(FIELD_CHARACTER_ENCODING_OVERLAY);

  // Get character encoding data, initialize with attributes if empty
  const characterEncodingRowData = useMemo(() => {
    const characterEncodingData = schemaState?.characterEncodingData || {};
    const attributes = schemaState?.attributes || [];
    
    // Convert data to UI format or initialize with attributes if empty
    if (Object.keys(characterEncodingData).length > 0) {
      return attributes.map((attr) => ({
        Attribute: attr.Attribute,
        "Character Encoding": characterEncodingData[attr.Attribute] || "utf-8"
      }));
    }

    // Initialize with current schema attributes if no data exists
    return attributes.map((attr) => ({
      Attribute: attr.Attribute,
      "Character Encoding": "utf-8" // default encoding
    }));
  }, [schemaState?.characterEncodingData, schemaState?.attributes]);

  // Update the character encoding data using simple field
  const setCharacterEncodingRowData = useCallback(
    (newData) => {
      // Transform UI data to simple object format
      const characterEncodingData = {};
      newData.forEach(row => {
        if (row.Attribute && row["Character Encoding"]) {
          characterEncodingData[row.Attribute] = row["Character Encoding"];
        }
      });

      updateSchema({ characterEncodingData });
    },
    [updateSchema]
  );

  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [buttonMarginTop, setButtonMarginTop] = useState(0);
  const gridRef = useRef();
  const gridContainerRef = useRef();
  const buttonContainerRef = useRef();
  const { handleSave, applyAllFunc } = useCharacterEncodingType(
    gridRef,
    characterEncodingRowData,
    setCharacterEncodingRowData
  );

  const getRowHeight = useCallback((params) => {
    const attrH = measureTextHeight(params.data?.Attribute || "", 164);
    const encH = measureTextHeight(String(params.data?.["Character Encoding"] ?? ""), 184);
    const maxH = Math.max(attrH, encH);
    return Math.max(32, maxH + 8);
  }, []);

  const columnDefs = useMemo(
    () => [
      {
        field: "Attribute",
        editable: false,
        width: 180,
        wrapText: true,
        cellStyle: () => greyCellStyle,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Attribute"),
          helpText:
            "This is the name for the attribute and, for example, will be the column header in every tabular data set no matter what language."
        }
      },
      {
        field: "Character Encoding",
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Character Encoding"),
          helpText:
            "Character encoding of the data for each attribute. Sometimes data is encoded in a specific character encoding which can be recorded here."
        },
        cellRenderer: CharacterEncodingTypeRenderer,
        cellRendererParams: (params) => ({
          attr: params.data.Attribute
        }),
        width: 200
      }
    ],
    [t]
  );

  const handleForward = useCallback(() => {
    handleSave();
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  }, [handleSave, setCurrentPage, setSelectedOverlay]);

  // Save changes when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      // Save on unmount - capture the grid data at unmount time
      if (gridRef.current?.api) {
        gridRef.current.api.stopEditing();
        const attributeWithCharacterEncoding = gridRef.current.api
          .getRenderedNodes()
          ?.map((node) => node?.data);
        
        // Transform UI data to simple object format
        if (attributeWithCharacterEncoding && attributeWithCharacterEncoding.length > 0) {
          const characterEncodingData = {};
          attributeWithCharacterEncoding.forEach(row => {
            if (row.Attribute && row["Character Encoding"]) {
              characterEncodingData[row.Attribute] = row["Character Encoding"];
            }
          });
          updateSchema({ characterEncodingData });
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  const onGridReady = useOverlayGridOnGridReady(setLoading);

  const encodingGridFixedViewport =
    characterEncodingRowData.length >= AG_GRID_VIRTUALIZE_MIN_ROWS;

  const onFirstDataRendered = useCallback(() => {
    requestAnimationFrame(() => {
      const firstRow = gridContainerRef.current?.querySelector(".ag-row");
      const buttonContainer = buttonContainerRef.current;
      if (!firstRow || !buttonContainer) return;
      const rowRect = firstRow.getBoundingClientRect();
      const containerRect = buttonContainer.getBoundingClientRect();
      const rowCenter = rowRect.top + rowRect.height / 2;
      const buttonH = 27.2;
      setButtonMarginTop(rowCenter - containerRect.top - buttonH / 2);
    });
  }, []);

  return (
    <BackNextSkeleton
      isForward
      pageForward={handleForward}
      isBack
      pageBack={() => setCurrentPage("Overlays")}
    >
      {loading && characterEncodingRowData?.length > 40 && <Loading />}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={deleteHandler}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box
        sx={{
          margin: "2rem",
          marginBottom: BETWEEN_SECTION_SPACING,
          gap: "3rem",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <Box style={{ display: "flex" }}>
          <Box
            ref={gridContainerRef}
            className={`character-encoding-grid overlay-grid-suppress-hscroll${encodingGridFixedViewport ? " overlay-grid-fixed-viewport" : ""} ag-theme-balham${encodingGridFixedViewport ? "" : " ag-grid-compact"}`}
            sx={{ width: 380 }}
          >
            <style>{gridStyles}</style>
            <AgGridReact
              key={`${i18n.language}-${encodingGridFixedViewport ? "fx" : "ah"}`}
              ref={gridRef}
              domLayout={encodingGridFixedViewport ? undefined : "autoHeight"}
              style={{
                width: "100%",
                height: encodingGridFixedViewport ? "100%" : "auto"
              }}
              rowData={characterEncodingRowData}
              columnDefs={columnDefs}
              getRowId={(params) => params.data?.Attribute ?? ""}
              suppressScrollOnNewData
              getRowHeight={getRowHeight}
              suppressHorizontalScroll
              onGridReady={onGridReady}
              onFirstDataRendered={onFirstDataRendered}
              overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
            />
          </Box>
          <Box
            ref={buttonContainerRef}
            sx={{
              width: 70,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start"
            }}
          >
            <Button
              color="navButton"
              sx={{
                ml: 1,
                width: "130px",
                height: "1.7rem",
                color: CustomPalette.PRIMARY,
                marginTop: `${buttonMarginTop}px`
              }}
              onClick={applyAllFunc}
            >
              {t("Apply All")}
            </Button>
          </Box>
        </Box>
      </Box>
    </BackNextSkeleton>
  );
};

export default CharacterEncoding;
