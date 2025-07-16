import React, { useContext, useMemo, useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, IconButton } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Context } from "../App";
import BackNextSkeleton from "../components/BackNextSkeleton";
import CellHeader from "../components/CellHeader";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import Loading from "../components/Loading";
import DeleteConfirmation from "./DeleteConfirmation";
import { FIELD_ATTRIBUTE_MAPPING_OVERLAY } from "../constants/constants";
import { CustomPalette } from "../constants/customPalette";

const AttributeMapping = () => {
  const {
    attributeMappingRowData,
    setAttributeMappingRowData,
    setCurrentPage,
    setSelectedOverlay,
    setOverlay
  } = useContext(Context);

  const { t } = useTranslation();
  const gridRef = useRef();
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [hoveredButton, setHoveredButton] = useState({ rowIndex: -1, buttonType: null });
  const [buttonArray, setButtonArray] = useState([]);
  const boxRefs = useRef([]);

  const columnDefs = useMemo(
    () => [
      {
        field: "subjectId",
        width: 220,
        autoHeight: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Subject"),
          helpText: t("This is the name for the attribute and, for example...")
        }
      },
      {
        field: "PredicateId",
        width: 220,
        autoHeight: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Predicate"),
          helpText: t("This is the name for the predicate and, for example...")
        }
      },
      {
        field: "ObjectId",
        width: 220,
        autoHeight: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Object"),
          helpText: t("This is the name for the object and, for example...")
        }
      },
      {
        field: "MappingJustification",
        width: 250,
        autoHeight: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Mapping Justification"),
          helpText: t(
            "This is the name for the mapping justification and, for example..."
          )
        }
      }
    ],
    [t]
  );

  const handleEditRow = (rowIndex) => {
    // TODO: Add edit logic here
    console.log("Edit clicked for row:", rowIndex);
  };

  const handleDeleteRow = (rowIndex) => {
    // TODO: Add delete logic here
    console.log("Delete clicked for row:", rowIndex);
  };

  const isEditHovered = (rowIndex) =>
    hoveredButton.rowIndex === rowIndex && hoveredButton.buttonType === "edit";

  const isDeleteHovered = (rowIndex) =>
    hoveredButton.rowIndex === rowIndex && hoveredButton.buttonType === "delete";

  useEffect(() => {
    if (attributeMappingRowData && attributeMappingRowData.length > 0) {
      const newButtonArray = [];
      boxRefs.current = [];

      newButtonArray.push(<Box sx={{ height: "2.2rem" }} key={0} />);

      attributeMappingRowData.forEach((item, index) => {
        const ref = React.createRef();
        boxRefs.current.push(ref);
        newButtonArray.push(
          <Box
            key={`${item.subjectId || "row"}-${item.PredicateId || index}`}
            ref={ref}
            sx={{
              ml: 1,
              display: "flex",
              gap: 0.5
            }}
          >
            <IconButton
              sx={{
                color: isEditHovered(index)
                  ? CustomPalette.PRIMARY
                  : CustomPalette.GREY_600,
                transition: "all 0.2s ease-in-out",
                padding: "4px"
              }}
              onClick={() => handleEditRow(index)}
              onMouseEnter={() =>
                setHoveredButton({ rowIndex: index, buttonType: "edit" })
              }
              onMouseLeave={() => setHoveredButton({ rowIndex: -1, buttonType: null })}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              sx={{
                color: isDeleteHovered(index)
                  ? CustomPalette.PRIMARY
                  : CustomPalette.GREY_600,
                transition: "all 0.2s ease-in-out",
                padding: "4px"
              }}
              onClick={() => handleDeleteRow(index)}
              onMouseEnter={() =>
                setHoveredButton({ rowIndex: index, buttonType: "delete" })
              }
              onMouseLeave={() => setHoveredButton({ rowIndex: -1, buttonType: null })}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      });

      setButtonArray(newButtonArray);
    } else {
      setButtonArray([]);
    }
  }, [attributeMappingRowData, hoveredButton]);

  // Remove the old mouse movement handler since we're using individual button hover events

  const handleDeleteCurrentOverlay = () => {
    setOverlay((prev) => ({
      ...prev,
      [FIELD_ATTRIBUTE_MAPPING_OVERLAY]: {
        ...prev[FIELD_ATTRIBUTE_MAPPING_OVERLAY],
        selected: false
      }
    }));

    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  const handleSave = () => {
    gridRef.current.api.stopEditing();
    const rowData = gridRef.current.api.getRenderedNodes()?.map((node) => node?.data);
    setAttributeMappingRowData(rowData);
  };

  const handleForward = () => {
    handleSave();
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  const handleBack = () => {
    setShowDeleteConfirmation(true);
  };

  return (
    <BackNextSkeleton
      isForward
      isBack
      pageForward={handleForward}
      pageBack={handleBack}
      backText="Remove overlay"
    >
      {loading && <Loading />}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={handleDeleteCurrentOverlay}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box sx={{ my: "2rem" }}>
        <Box sx={{ display: "flex" }}>
          <Box className="ag-theme-balham" sx={{ width: 911.5 }}>
            <style>{gridStyles}</style>
            <AgGridReact
              ref={gridRef}
              rowData={attributeMappingRowData}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              stopEditingWhenCellsLoseFocus
              onGridReady={() => setLoading(false)}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end"
            }}
          >
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-around"
              }}
            >
              {buttonArray}
            </Box>
          </Box>
        </Box>
      </Box>
    </BackNextSkeleton>
  );
};

export default AttributeMapping;
