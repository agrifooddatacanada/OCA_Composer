import React, { useContext, useMemo, useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, IconButton } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { Context } from "../App";
import BackNextSkeleton from "../components/BackNextSkeleton";
import CellHeader from "../components/CellHeader";
import Spinner from "../components/Spinner";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import DeleteConfirmation from "./DeleteConfirmation";
import { FIELD_ATTRIBUTE_FRAMING_OVERLAY } from "../constants/constants";
import { CustomPalette } from "../constants/customPalette";
import { matchedSubjectAndPredicate } from "../constants/utils";

const EditButton = ({ node }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <IconButton
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => console.log("Edit clicked for row:", node.rowIndex)}
      sx={{
        color: isHovered ? CustomPalette.PRIMARY : CustomPalette.GREY_600,
        transition: "all 0.2s ease-in-out",
        padding: "4px",
        "&:hover": {
          backgroundColor: `${CustomPalette.PRIMARY}10`,
          transform: "scale(1.05)"
        }
      }}
    >
      <EditIcon fontSize="small" />
    </IconButton>
  );
};

const DeleteButton = ({ node }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <IconButton
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => console.log("Delete clicked for row:", node.rowIndex)}
      sx={{
        color: isHovered ? CustomPalette.PRIMARY : CustomPalette.GREY_600,
        transition: "all 0.2s ease-in-out",
        padding: "4px",
        "&:hover": {
          backgroundColor: `${CustomPalette.PRIMARY}10`,
          transform: "scale(1.05)"
        }
      }}
    >
      {isHovered ? (
        <DeleteForeverIcon fontSize="small" />
      ) : (
        <DeleteOutlineIcon fontSize="small" />
      )}
    </IconButton>
  );
};

const AttributeFraming = () => {
  const {
    attributeFramingRowData,
    setAttributeFramingRowData,
    setCurrentPage,
    setSelectedOverlay,
    setOverlay
  } = useContext(Context);

  const { t } = useTranslation();
  const gridRef = useRef();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [predicatesLoaded, setPredicatesLoaded] = useState(false);
  const [isLoadingPredicates, setIsLoadingPredicates] = useState(true);

  const columnDefs = useMemo(
    () => [
      {
        field: "subjectId",
        width: 150,
        autoHeight: true,
        editable: false,
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Subject"),
          helpText: t("This is the name for the attribute and, for example...")
        }
      },
      {
        field: "predicateId",
        width: 150,
        autoHeight: true,
        editable: false,
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Predicate"),
          helpText: t("This is the name for the predicate and, for example...")
        }
      },
      {
        field: "objectId",
        width: 150,
        autoHeight: true,
        editable: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Object"),
          helpText: t("This is the name for the object and, for example...")
        }
      },
      {
        field: "description",
        width: 400,
        autoHeight: true,
        editable: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Description"),
          helpText: t("This is the name for the description and, for example...")
        }
      },
      {
        field: "mappingJustification",
        width: 300,
        autoHeight: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Mapping Justification"),
          helpText: t(
            "This is the name for the mapping justification and, for example..."
          )
        }
      },
      {
        headerName: t("Edit"),
        field: "edit",
        width: 70,
        cellRendererFramework: EditButton,
        cellStyle: () => ({
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        })
      },
      {
        headerName: t("Delete"),
        field: "delete",
        width: 70,
        cellRendererFramework: DeleteButton,
        cellStyle: () => ({
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        })
      }
    ],
    [t]
  );

  useEffect(() => {
    const populateAttributeFraming = async () => {
      if (attributeFramingRowData && attributeFramingRowData.length > 0) {
        const hasObjects = attributeFramingRowData.some((row) => row.objectId);

        if (hasObjects) {
          setPredicatesLoaded(true);
          return;
        }

        setIsLoadingPredicates(true);
        const updatedRowData = [...attributeFramingRowData];

        const promises = updatedRowData.map(async (row, index) => {
          if (row.subjectId && !row.objectId) {
            try {
              const matchedResult = await matchedSubjectAndPredicate({
                page: 1,
                page_size: 10,
                query: row.subjectId
              });

              if (matchedResult) {
                updatedRowData[index] = {
                  ...row,
                  objectId: matchedResult.label || "",
                  description: matchedResult.definition || ""
                };
              }
            } catch (error) {
              console.log(`No match found for subject: ${row.subjectId}`);
            }
          }
        });

        await Promise.all(promises);
        setAttributeFramingRowData(updatedRowData);
        setPredicatesLoaded(true);
        // Add a small delay to make the loading state visible
        setTimeout(() => {
          setIsLoadingPredicates(false);
        }, 500);
      } else {
        setPredicatesLoaded(true);
        setIsLoadingPredicates(false);
      }
    };

    populateAttributeFraming();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributeFramingRowData]);

  const handleDeleteCurrentOverlay = () => {
    setOverlay((prev) => ({
      ...prev,
      [FIELD_ATTRIBUTE_FRAMING_OVERLAY]: {
        ...prev[FIELD_ATTRIBUTE_FRAMING_OVERLAY],
        selected: false
      }
    }));

    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  const handleSave = () => {
    gridRef.current.api.stopEditing();
    const rowData = gridRef.current.api.getRenderedNodes()?.map((node) => node?.data);
    setAttributeFramingRowData(rowData);
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
      {/* {loading && <Loading text="Loading predicates..." />} */}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={handleDeleteCurrentOverlay}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box sx={{ my: "2rem" }}>
        {!predicatesLoaded ? (
          <Spinner text="Framing Attributes..." size={36} />
        ) : isLoadingPredicates ? (
          <Spinner text="Framing Attributes..." size={36} />
        ) : (
          <Box sx={{ my: "2rem" }}>
            <Box className="ag-theme-balham" sx={{ width: 1290 }}>
              <style>{gridStyles}</style>
              <AgGridReact
                ref={gridRef}
                rowData={attributeFramingRowData}
                columnDefs={columnDefs}
                domLayout="autoHeight"
                stopEditingWhenCellsLoseFocus
                onGridReady={() => {}}
              />
            </Box>
          </Box>
        )}
      </Box>
    </BackNextSkeleton>
  );
};

export default AttributeFraming;
