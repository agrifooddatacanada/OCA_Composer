// TODO: change to framing_justification instead of mapping_justification.
// !Important: in generating extension input object if the term_id is empty we don't include it.

import React, {
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle
} from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  IconButton,
  TextField,
  Grid,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { AgGridReact } from "../components/AgGridReact";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import BackNextSkeleton from "../components/BackNextSkeleton";
import CellHeader from "../components/CellHeader";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import DeleteConfirmation from "./DeleteConfirmation";
import { getAllGridRowData } from "./gridUtils";
import { useDeleteOverlayHandler } from "../utils/overlayUtils";
import {
  BETWEEN_SECTION_SPACING,
  FIELD_ATTRIBUTE_FRAMING_OVERLAY,
  ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS,
  DEFAULT_ATTRIBUTE_FRAMING_METADATA
} from "../constants/constants";
import { CustomPalette } from "../constants/customPalette";

// Shared with DropdownCellRenderer so its onChange handler can reach the
// currently mounted AttributeFraming grid's API to commit edits.
let globalGridRef = null;

const MAX_TEXT_WIDTH = "600px";

const DropdownCellRenderer = ({
  value,
  rowIndex,
  fieldName,
  options,
  maxTextLength = 25,
  onValueChanged
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || options[0]?.value);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setSelectedValue(newValue);

    if (globalGridRef && globalGridRef.current && globalGridRef.current.api) {
      const node = globalGridRef.current.api.getRowNode(rowIndex);
      if (node) {
        node.setDataValue(fieldName, newValue);
      }
    }
    setIsDropdownOpen(false);
    if (onValueChanged) onValueChanged();
  };

  useEffect(() => {
    setSelectedValue(value || options[0]?.value);
  }, [value, options]);

  const getDisplayText = (value) => {
    const option = options.find((opt) => opt.value === value);
    const text = option ? option.label : value;
    return text.length > maxTextLength ? `${text.substring(0, maxTextLength)}...` : text;
  };

  const getFullText = (value) => {
    const option = options.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <Box sx={{ height: "100%", display: "flex", alignItems: "center", width: "100%" }}>
      <FormControl fullWidth variant="standard" sx={{ height: "100%" }}>
        <Select
          value={selectedValue}
          onChange={handleChange}
          variant="standard"
          disableUnderline
          title={getFullText(selectedValue)}
          sx={{
            height: "100%",
            fontSize: "small",
            "& .MuiSelect-select": {
              padding: "4px 8px",
              fontSize: "12px",
              color: CustomPalette.GREY_800,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: "1.2",
              minHeight: "auto"
            }
          }}
          open={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          onOpen={() => setIsDropdownOpen(true)}
          renderValue={(value) => getDisplayText(value)}
        >
          {options.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

const DeleteButton = ({ node, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <IconButton
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onDelete(node.rowIndex)}
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

const AttributeFraming = forwardRef((_props, ref) => {
  const {
    setCurrentPage
  } = useContext(Context);

  const {
    getSchema,
    updateSchema,
    setSelectedOverlay
  } = useMultiSchema();

  const schemaState = getSchema();
  const attributeFramingRowData = useMemo(
    () => schemaState?.attributeFramingData || [],
    [schemaState?.attributeFramingData]
  );
  const frameAllAttributes = schemaState?.frameAllAttributes || false;
  const unframedAttributeList = schemaState?.unframedAttributeList || [];
  const attributes = useMemo(
    () => schemaState?.attributes || [],
    [schemaState?.attributes]
  );
  const framingMetadata = useMemo(
    () => schemaState?.attributeFramingMetadata || DEFAULT_ATTRIBUTE_FRAMING_METADATA,
    [schemaState?.attributeFramingMetadata]
  );

  // Setter functions that update MultiSchemaContext
  const setAttributeFramingRowData = useCallback((data) => {
    updateSchema({ attributeFramingData: data });
  }, [updateSchema]);

  const setFrameAllAttributes = useCallback((value) => {
    updateSchema({ frameAllAttributes: value });
  }, [updateSchema]);

  const setUnframedAttributeList = useCallback((list) => {
    updateSchema({ unframedAttributeList: list });
  }, [updateSchema]);

  const handleMetadataChange = useCallback(
    (field, value) => {
      updateSchema({
        attributeFramingMetadata: { ...framingMetadata, [field]: value }
      });
    },
    [updateSchema, framingMetadata]
  );

  // Seed one framing row per schema attribute the first time the editor is
  // opened with no persisted framing data. Uses a ref so intentionally cleared
  // rows are not re-seeded within the same mount.
  const hasSeededRef = useRef(false);
  useEffect(() => {
    if (hasSeededRef.current) return;
    if (attributeFramingRowData.length > 0) {
      hasSeededRef.current = true;
      return;
    }
    const seeded = attributes
      .filter((attr) => attr?.Attribute && String(attr.Attribute).trim() !== "")
      .map((attr) => ({
        Attribute: attr.Attribute,
        objectId: "",
        description: "",
        predicateId: "",
        mappingJustification: ""
      }));
    if (seeded.length > 0) {
      hasSeededRef.current = true;
      setAttributeFramingRowData(seeded);
    }
  }, [attributes, attributeFramingRowData, setAttributeFramingRowData]);

  const { t, i18n } = useTranslation();
  const gridRef = useRef();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [gridReady, setGridReady] = useState(false);

  // Use centralized delete handler
  const deleteHandler = useDeleteOverlayHandler(FIELD_ATTRIBUTE_FRAMING_OVERLAY);

  const hasUnframedAttributes = unframedAttributeList && unframedAttributeList.length > 0;

  // Update unframed attributes list whenever attributeFramingRowData changes
  useEffect(() => {
    if (attributeFramingRowData && attributeFramingRowData.length > 0) {
      const unframed = attributeFramingRowData
        .filter((row) => !row.objectId || row.objectId.trim() === "")
        .map((row) => row.Attribute);
      setUnframedAttributeList(unframed);

      // Update frameAllAttributes based on whether all attributes are framed
      const allFramed = attributeFramingRowData.every(
        (row) => row.objectId && row.objectId.trim() !== ""
      );
      setFrameAllAttributes(allFramed && attributeFramingRowData.length > 0);
    }
  }, [attributeFramingRowData, setUnframedAttributeList, setFrameAllAttributes]);

  // Commit whatever is currently displayed in the grid back into schema state.
  // Wired to every editable/selectable column so manual edits are persisted
  // as the user works, not just on navigation.
  const handleCellChanged = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const displayedRows = getAllGridRowData(api);
    if (displayedRows.length === 0) return;
    setAttributeFramingRowData(displayedRows);
  }, [setAttributeFramingRowData]);

  const handleDelete = useCallback(
    (rowIndex) => {
      const updatedRowData = attributeFramingRowData.filter(
        (_, index) => index !== rowIndex
      );
      setAttributeFramingRowData(updatedRowData);
    },
    [attributeFramingRowData, setAttributeFramingRowData]
  );

  const predicateOptions = useMemo(
    () => [
      { value: "", label: t("Select a predicate...") },
      ...ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.typeOfMatch
    ],
    [t]
  );

  const justificationOptions = useMemo(
    () => [
      { value: "", label: t("Select a justification...") },
      ...ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.mappingJustification
    ],
    [t]
  );

  const columnDefs = useMemo(
    () => [
      {
        field: "Attribute",
        width: 150,
        autoHeight: true,
        editable: false,
        cellStyle: preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Subject"),
          helpText: t("Name for the attribute and, for example, the column header in every tabular data set no matter what language")
        }
      },
      {
        field: "predicateId",
        width: 190,
        autoHeight: true,
        editable: false,
        cellStyle: preWrapWordBreak,
        cellRenderer: DropdownCellRenderer,
        cellRendererParams: {
          fieldName: "predicateId",
          options: predicateOptions,
          maxTextLength: 30,
          onValueChanged: handleCellChanged
        },
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Predicate"),
          helpText: t("Mapping vocabulary to reasonate the relationship between the attribute and ontologies terms")
        }
      },
      {
        field: "objectId",
        width: 220,
        autoHeight: true,
        editable: true,
        singleClickEdit: true,
        cellStyle: preWrapWordBreak,
        onCellValueChanged: handleCellChanged,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Object"),
          helpText: t("Ontology term identifier for this attribute, entered manually (e.g. FOODON:00002403)")
        }
      },
      {
        field: "description",
        width: 380,
        autoHeight: true,
        editable: true,
        singleClickEdit: true,
        cellStyle: preWrapWordBreak,
        onCellValueChanged: handleCellChanged,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Description"),
          helpText: t("Definition")
        }
      },
      {
        field: "mappingJustification",
        width: 260,
        autoHeight: true,
        editable: false,
        cellStyle: preWrapWordBreak,
        cellRenderer: DropdownCellRenderer,
        cellRendererParams: {
          fieldName: "mappingJustification",
          options: justificationOptions,
          maxTextLength: 35,
          onValueChanged: handleCellChanged
        },
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Framing Justification"),
          helpText: t("Framing Justification")
        }
      },
      {
        headerName: t("Delete"),
        field: "delete",
        width: 70,
        cellRendererFramework: DeleteButton,
        cellRendererParams: {
          onDelete: handleDelete
        },
        cellStyle: () => ({
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        })
      }
    ],
    [t, handleDelete, predicateOptions, justificationOptions, handleCellChanged]
  );

  const unframedAttributesText = frameAllAttributes
    ? t("All attributes are framed")
    : hasUnframedAttributes
      ? `${t("Unframed attributes")}: [${unframedAttributeList.join(", ")}]`
      : t("No attributes to frame");

  const handleSave = useCallback(() => {
    if (!gridReady || !gridRef.current?.api) {
      console.warn("Grid not ready for save operation");
      return;
    }

    try {
      gridRef.current.api.stopEditing();
      const rowData = getAllGridRowData(gridRef.current.api);
      if (rowData.length > 0) {
        setAttributeFramingRowData(rowData);
      }
    } catch (error) {
      console.error("Error saving grid data:", error);
    }
  }, [gridReady, setAttributeFramingRowData]);

  useImperativeHandle(
    ref,
    () => ({
      save: handleSave
    }),
    [handleSave]
  );

  const handleLeaveToOverlays = useCallback(() => {
    handleSave();
    setCurrentPage("Overlays");
  }, [handleSave, setCurrentPage]);

  const handleForward = () => {
    handleSave();
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  const onGridReady = useCallback(() => {
    globalGridRef = gridRef;
    setGridReady(true);
  }, []);

  return (
    <BackNextSkeleton
      isForward
      isBack
      pageForward={handleForward}
      pageBack={handleLeaveToOverlays}
    >
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={deleteHandler}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box sx={{ my: "2rem", mb: BETWEEN_SECTION_SPACING }}>
        <Box
          sx={{
            margin: { xs: "1rem", sm: "2rem" },
            gap: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            overflow: "visible"
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              width: "100%",
              maxWidth: "900px",
              p: { xs: 2, sm: 3 },
              borderColor: CustomPalette.GREY_300
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: CustomPalette.PRIMARY, mb: 0.5 }}
            >
              {t("Framing source")}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mb: 2 }}
            >
              {t(
                "Describe the ontology or vocabulary these attributes are framed against. This is stored as the overlay's framing metadata."
              )}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("ID")}
                  placeholder="FOODON"
                  value={framingMetadata.id || ""}
                  onChange={(e) => handleMetadataChange("id", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("Label")}
                  placeholder="Food Ontology"
                  value={framingMetadata.label || ""}
                  onChange={(e) => handleMetadataChange("label", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("Location")}
                  placeholder="https://..."
                  value={framingMetadata.location || ""}
                  onChange={(e) => handleMetadataChange("location", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("Version")}
                  placeholder="1.0"
                  value={framingMetadata.version || ""}
                  onChange={(e) => handleMetadataChange("version", e.target.value)}
                />
              </Grid>
            </Grid>
            {framingMetadata.imports &&
              Object.keys(framingMetadata.imports).length > 0 && (
                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 1.5, color: "text.secondary" }}
                >
                  {t("Imported framing sources")}:{" "}
                  {Object.keys(framingMetadata.imports).join(", ")}
                </Typography>
              )}
          </Paper>

          <Box
            sx={{
              textAlign: "center",
              fontSize: "0.9rem",
              color: "text.secondary",
              maxWidth: MAX_TEXT_WIDTH,
              wordWrap: "break-word"
            }}
          >
            {unframedAttributesText}
          </Box>

          <Box
            className="ag-theme-balham"
            sx={{
              width: "100%",
              minWidth: "1230px",
              overflowX: "auto",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          >
            <style>{gridStyles}</style>
            <AgGridReact
              key={i18n.language}
              ref={gridRef}
              rowData={attributeFramingRowData}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              suppressRowHoverHighlight
              stopEditingWhenCellsLoseFocus
              suppressHorizontalScroll={false}
              onGridReady={onGridReady}
              overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
            />
          </Box>
        </Box>
      </Box>
    </BackNextSkeleton>
  );
});

AttributeFraming.displayName = "AttributeFraming";

export default AttributeFraming;
