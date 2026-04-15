import React, {
  useCallback,
  useContext,
  useRef,
  useState,
  memo,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo
} from "react";
import {
  Box,
  TextField,
  Autocomplete,
  Popper,
  Button,
  Typography
} from "@mui/material";
import MuiLink from "@mui/material/Link";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { AgGridReact } from "../components/AgGridReact";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { useTranslation } from "react-i18next";
import { styled } from "@mui/material/styles";
import BackNextSkeleton from "../components/BackNextSkeleton";
import {
  AG_GRID_EMPTY_NO_ATTRIBUTES_BODY_MIN_PX,
  AG_GRID_EMPTY_NO_ATTRIBUTES_GRID_MIN_PX,
  BETWEEN_SECTION_SPACING
} from "../constants/constants";
import CellHeader from "../components/CellHeader";
import { gridStyles, greyCellStyle, preWrapWordBreak } from "../constants/styles";
import { measureTextHeight } from "../utils/measureTextLines";
import DeleteConfirmation from "./DeleteConfirmation";
import { CustomPalette } from "../constants/customPalette";
import Loading from "../components/Loading";
import { searchUnits } from "../utils/helpers";
import { FIELD_UNIT_FRAMING_OVERLAY } from "../constants/constants";
import { useDeleteOverlayHandler } from "../utils/overlayUtils";
import { useOverlayGridOnGridReady } from "./gridUtils";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";

const GRID_WIDTH = 705;
const LOADING_THRESHOLD = 40;
const BUTTON_MIN_WIDTH = "150px";
const MAX_TEXT_WIDTH = "600px";
const STATUS_AREA_HEIGHT = 44;

const allowOverflowStyle = {
  ...preWrapWordBreak,
  overflow: "auto"
};

const CustomPopper = styled(Popper)(() => ({ width: "100%" }));

const buttonDisabledStyles = {
  backgroundColor: "grey.400 !important",
  color: "grey.600 !important",
  "&:hover": {
    backgroundColor: "grey.400 !important"
  },
  "&:disabled": {
    backgroundColor: "grey.400 !important",
    color: "grey.600 !important"
  }
};

// managing unit data
const useUnitData = (currentUnitFramedRowData) => {
  const [tempToDisplayRowData, setTempToDisplayRowData] = useState([]);

  const processUnitData = useCallback(() => {
    // Always use currentUnitFramedRowData as the source
    // Ensure it's an array
    const sourceData = Array.isArray(currentUnitFramedRowData) ? currentUnitFramedRowData : [];

    // Create unique units map
    const unitFramedRowDataSet = Array.from(
      new Map(sourceData.map((row) => [row.Unit, row])).values()
    );

    // Show all units, don't filter by deleted flag
    // Deleted units will have their UCUM data cleared
    setTempToDisplayRowData(unitFramedRowDataSet);
  }, [currentUnitFramedRowData]);

  useEffect(() => {
    processUnitData();
  }, [processUnitData]);

  return { tempToDisplayRowData, setTempToDisplayRowData, processUnitData };
};

const TrashCanButton = memo((props) => {
  const { setUnitFramedRowData, setFrameAllUnits, unitFramedRowData } = props;

  const handleDelete = useCallback(() => {
    // Ensure unitFramedRowData is an array
    const dataArray = Array.isArray(unitFramedRowData) ? unitFramedRowData : [];
    const newData = dataArray.map((row) =>
      row.Unit === props.node.data.Unit 
        ? { 
            ...row, 
            "UCUM Code": "",
            "UCUM Label": "",
            Description: "",
            deleted: true 
          } 
        : row
    );
    setUnitFramedRowData(newData);

    // When deleting a unit, turn off frame all units flag
    setFrameAllUnits(false);

    // Update the grid cell display
    props.node.updateData({
      ...props.node.data,
      "UCUM Code": "",
      "UCUM Label": "",
      Description: ""
    });

    props?.onRefresh();
  }, [props.node.data, setUnitFramedRowData, setFrameAllUnits, unitFramedRowData, props]);

  const isVisible = props.node.data?.Unit !== "";
  if (!isVisible) return null;
  return (
    <Box className="delete-icon-wrapper" sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <DeleteOutlineIcon sx={{ color: CustomPalette.GREY_600 }} className="delete-icon-outline" />
      <DeleteForeverIcon onClick={handleDelete} sx={{ color: CustomPalette.PRIMARY, cursor: "pointer" }} className="delete-icon-solid" />
    </Box>
  );
});

TrashCanButton.displayName = "TrashCanButton";

const UnitFramingAutoCompleteEditor = memo(
  forwardRef(({ search, value, initialOptions }, ref) => {
    const [options, setOptions] = useState(initialOptions || []);
    const [autoValue, setAutoValue] = useState(value || "");
    const inputRef = useRef({ value });

    const onOptionSelected = useCallback(
      (event, newValue) => {
        setAutoValue(newValue);
        inputRef.current.value = newValue;

        if (ref?.current) {
          ref.current.api.stopEditing();
        }
      },
      [ref]
    );

    const onInputChangeHandler = useCallback(
      (event, newInputValue) => {
        setAutoValue(newInputValue);
        search(newInputValue, (newOptions) => {
          setOptions(newOptions);

          // Check for exact match
          const exactMatch = newOptions.find((option) => option === newInputValue);
          if (exactMatch) {
            onOptionSelected(event, exactMatch);
          }
        });
      },
      [search, onOptionSelected]
    );

    const onKeyDownHandler = useCallback(
      (event) => {
        if (event.key === "Enter") {
          const exactMatch = options.find((option) => option === autoValue);
          if (exactMatch) {
            onOptionSelected(event, exactMatch);
          }
        }
      },
      [options, autoValue, onOptionSelected]
    );

    useEffect(() => {
      inputRef.current.value = value;
    }, [value]);

    useImperativeHandle(ref, () => ({
      getValue: () => inputRef.current.value
    }));

    return (
      <Autocomplete
        sx={{ width: "100%" }}
        disableClearable
        clearOnEscape
        autoHighlight
        selectOnFocus
        clearOnBlur
        freeSolo
        onKeyDown={onKeyDownHandler}
        options={options}
        value={autoValue}
        onInputChange={onInputChangeHandler}
        onChange={onOptionSelected}
        PopperComponent={CustomPopper}
        renderInput={(params) => (
          <TextField
            {...params}
            sx={{
              "& .MuiInputBase-input": {
                fontSize: "0.80rem"
              },
              "& .MuiFormLabel-root": {
                fontSize: "0.8rem"
              }
            }}
            placeholder="Search..."
            InputProps={{
              ...params.InputProps,
              type: "search"
            }}
          />
        )}
        getOptionLabel={(option) => option}
        renderOption={(props, option) => (
          <li {...props} style={{ fontSize: "0.8rem" }}>
            {option}
          </li>
        )}
      />
    );
  })
);

UnitFramingAutoCompleteEditor.displayName = "UnitFramingAutoCompleteEditor";

const createCellEditorParams = (searchUnits, key) => ({
  search: (inputValue, setOptions) => {
    const { results } = searchUnits(inputValue || "");
    setOptions(results.map((item) => item[key]));
  }
});

const createOnCellValueChanged = (searchUnits, key, onSave) => (params) => {
  const selectedValue = params.newValue;
  const { results } = searchUnits(selectedValue || "");

  const selectedItem = results.find((item) => item[key] === selectedValue);

  if (selectedItem) {
    params.node.setData({
      ...params.data,
      "UCUM Code": selectedItem.code,
      "UCUM Label": selectedItem.label,
      Description: selectedItem.description
    });
    params.api.refreshCells({ rowNodes: [params.node], force: true });
    requestAnimationFrame(() => params.api.resetRowHeights());
    if (onSave) {
      onSave();
    }
  }
};

const useColumnDefs = (gridRef, t, onCellChanged) =>
  useMemo(
    () => [
      {
        field: "Unit",
        editable: false,
        width: 100,
        cellStyle: () => ({ ...greyCellStyle, overflow: "auto" }),
        headerComponent: () => (
          <CellHeader
            headerText={t("Unit")}
            helpText={t("The units defined in schema")}
          />
        )
      },
      {
        field: "UCUM Code",
        width: 185,
        cellStyle: () => allowOverflowStyle,
        cellEditor: UnitFramingAutoCompleteEditor,
        cellEditorParams: createCellEditorParams(searchUnits, "code"),
        singleClickEdit: true,
        editable: true,
        onCellValueChanged: createOnCellValueChanged(searchUnits, "code", onCellChanged),
        headerComponent: () => (
          <CellHeader headerText={t("UCUM Code")} helpText={t("UCUM Code")} />
        )
      },
      {
        field: "UCUM Label",
        width: 185,
        cellStyle: () => allowOverflowStyle,
        cellEditor: UnitFramingAutoCompleteEditor,
        cellEditorParams: createCellEditorParams(searchUnits, "label"),
        singleClickEdit: true,
        editable: true,
        onCellValueChanged: createOnCellValueChanged(searchUnits, "label", onCellChanged),
        headerComponent: () => (
          <CellHeader headerText={t("UCUM Label")} helpText={t("UCUM Label")} />
        )
      },
      {
        field: "Description",
        width: 185,
        cellStyle: () => allowOverflowStyle,
        cellEditor: UnitFramingAutoCompleteEditor,
        cellEditorParams: createCellEditorParams(searchUnits, "description"),
        singleClickEdit: true,
        editable: true,
        onCellValueChanged: createOnCellValueChanged(searchUnits, "description", onCellChanged),
        headerComponent: () => (
          <CellHeader
            headerText={t("UCUM Unit Description")}
            helpText={t("UCUM Unit Description")}
          />
        )
      },
      {
        headerName: "",
        field: "Delete",
        cellRendererFramework: TrashCanButton,
        width: 48
        // cellRendererParams will be added in columnDefsWithCallbacks
      }
    ],
    [t, gridRef, onCellChanged]
  );

const UnitFraming = () => {
  const { t, i18n } = useTranslation();
  const { setCurrentPage } = useContext(Context);

  // Use MultiSchema context with standard pattern
  const {
    getSchema,
    updateSchema,
    setSelectedOverlay
  } = useMultiSchema();
  const schemaState = getSchema();
  const noAttributes = (schemaState?.attributes || []).length === 0;
  const deleteHandler = useDeleteOverlayHandler(FIELD_UNIT_FRAMING_OVERLAY);

  // Get unit framing data from schema state, sync with current attributes
  const unitFramedRowData = useMemo(() => {
    const attributes = schemaState?.attributes || [];
    const existingData = schemaState?.unitFramedData;
    // Ensure existing is always an array
    const existing = Array.isArray(existingData) ? existingData : [];
    
    // Create a map of existing unit framing data by Attribute name
    const existingMap = new Map(
      existing.map((row) => [row.Attribute, row])
    );
    
    // Build unit framed data from current attributes (do NOT auto-search UCUM here)
    // AttributeDetails is the single source that auto-populates UCUM codes on save.
    const framedData = attributes
      .filter((attr) => attr.Unit) // Only attributes with units
      .map((attr) => {
        const existingRow = existingMap.get(attr.Attribute);

        // If unit changed, start fresh but do NOT auto-search for UCUM
        if (existingRow && existingRow.Unit !== attr.Unit) {
          return {
            Attribute: attr.Attribute,
            Unit: attr.Unit,
            "UCUM Code": "",
            "UCUM Label": "",
            Description: "",
            deleted: existingRow.deleted || false
          };
        }

        // Preserve any existing persisted framing row as-is
        if (existingRow) {
          return existingRow;
        }

        // New attribute with unit - do not auto-populate UCUM here
        return {
          Attribute: attr.Attribute,
          Unit: attr.Unit,
          "UCUM Code": "",
          "UCUM Label": "",
          Description: "",
          deleted: false
        };
      });
    
    return framedData;
  }, [schemaState?.unitFramedData, schemaState?.attributes]);

  const setUnitFramedRowData = useCallback(
    (newDataOrUpdater) => {
      // Handle both direct data and function updater patterns
      if (typeof newDataOrUpdater === 'function') {
        const existingData = schemaState?.unitFramedData;
        const currentData = Array.isArray(existingData) ? existingData : [];
        const newData = newDataOrUpdater(currentData);
        updateSchema({
          unitFramedData: newData
        });
      } else {
        updateSchema({
          unitFramedData: newDataOrUpdater
        });
      }
    },
    [updateSchema, schemaState]
  );

  // Get frame all units flag from schema state
  const frameAllUnits = schemaState?.frameAllUnits || false;
  const setFrameAllUnits = useCallback(
    (value) => {
      updateSchema({ frameAllUnits: value });
    },
    [updateSchema]
  );

  // Get unframed unit list - calculate from unitFramedRowData
  const unframedUnitList = useMemo(() => {
    if (frameAllUnits) {
      return [];
    }
    
    // Get unique units that don't have UCUM codes yet
    const uniqueUnits = new Map();
    const dataArray = Array.isArray(unitFramedRowData) ? unitFramedRowData : [];
    dataArray.forEach((row) => {
      if (row.Unit && !row["UCUM Code"]) {
        uniqueUnits.set(row.Unit, true);
      }
    });
    
    return Array.from(uniqueUnits.keys());
  }, [unitFramedRowData, frameAllUnits]);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef();

  const { tempToDisplayRowData, setTempToDisplayRowData } = useUnitData(
    unitFramedRowData
  );

  // Callback to save data when cell value changes via autocomplete
  const handleCellChanged = useCallback(() => {
    if (gridRef.current?.api) {
      const displayedFramedUnits =
        gridRef.current.api.getRenderedNodes()?.map((node) => node?.data) || [];
      
      if (displayedFramedUnits.length > 0) {
        // Update all rows with current grid data
        const finalUnitFramedRowData = unitFramedRowData.map((row) => {
          const displayedRow = displayedFramedUnits.find(
            (displayed) => displayed.Unit === row.Unit && displayed.Attribute === row.Attribute
          );

          if (displayedRow) {
            return {
              ...row,
              "UCUM Code": displayedRow["UCUM Code"],
              "UCUM Label": displayedRow["UCUM Label"],
              Description: displayedRow.Description
            };
          }
          
          return row;
        });
        
        setUnitFramedRowData(finalUnitFramedRowData);
      }
    }
  }, [unitFramedRowData, setUnitFramedRowData]);

  const columnDefs = useColumnDefs(gridRef, t, handleCellChanged);

  const getRowHeight = useCallback((params) => {
    const unitH = measureTextHeight(params.data?.Unit || "", 100, {});
    const codeH = measureTextHeight(params.data?.["UCUM Code"] || "", 185, {});
    const labelH = measureTextHeight(params.data?.["UCUM Label"] || "", 185, {});
    const descH = measureTextHeight(params.data?.Description || "", 185, {});
    const maxH = Math.max(unitH, codeH, labelH, descH);
    return Math.max(50, maxH + 16);
  }, []);

  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    requestAnimationFrame(() => api.resetRowHeights());
  }, [tempToDisplayRowData]);

  // Pass setUnitFramedRowData and setFrameAllUnits to column defs
  const columnDefsWithCallbacks = useMemo(() => 
    columnDefs.map(col => {
      if (col.field === 'Delete') {
        return {
          ...col,
          cellRendererParams: (params) => ({
            setUnitFramedRowData,
            setFrameAllUnits,
            unitFramedRowData,
            onRefresh: () => {
              gridRef.current?.api?.redrawRows({ rowNodes: [params.node] });
            }
          })
        };
      }
      return col;
    }),
    [columnDefs, setUnitFramedRowData, setFrameAllUnits, unitFramedRowData]
  );



  const handleSave = useCallback(() => {
    gridRef.current?.api?.stopEditing();
    const displayedFramedUnits =
      gridRef.current?.api?.getRenderedNodes()?.map((node) => node?.data) || [];

    // Update all rows with current grid data
    const finalUnitFramedRowData = unitFramedRowData.map((row) => {
      const displayedRow = displayedFramedUnits.find(
        (displayed) => displayed.Unit === row.Unit && displayed.Attribute === row.Attribute
      );

      if (displayedRow) {
        return {
          ...row,
          "UCUM Code": displayedRow["UCUM Code"],
          "UCUM Label": displayedRow["UCUM Label"],
          Description: displayedRow.Description
        };
      }
      
      return row;
    });

    setUnitFramedRowData(finalUnitFramedRowData);
  }, [unitFramedRowData, setUnitFramedRowData]);

  const handleForward = useCallback(() => {
    handleSave();
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  }, [handleSave, setSelectedOverlay, setCurrentPage]);

  // Save changes when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      if (gridRef.current?.api) {
        gridRef.current.api.stopEditing();
        const displayedFramedUnits =
          gridRef.current.api.getRenderedNodes()?.map((node) => node?.data) || [];
        
        if (displayedFramedUnits.length > 0 || unitFramedRowData.length > 0) {
          // Update all rows with current grid data
          const finalUnitFramedRowData = unitFramedRowData.map((row) => {
            const displayedRow = displayedFramedUnits.find(
              (displayed) => displayed.Unit === row.Unit && displayed.Attribute === row.Attribute
            );

            if (displayedRow) {
              return {
                ...row,
                "UCUM Code": displayedRow["UCUM Code"],
                "UCUM Label": displayedRow["UCUM Label"],
                Description: displayedRow.Description
              };
            }
            
            return row;
          });
          
          setUnitFramedRowData(finalUnitFramedRowData);
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  const handleFrameAllUnits = useCallback(() => {
    gridRef.current?.api?.stopEditing();
    const displayedFramedUnits =
      gridRef.current?.api?.getRenderedNodes()?.map((node) => node?.data) || [];

    // Merge displayed data with all rows (including deleted)
    const updatedData = unitFramedRowData.map((row) => {
      const displayedRow = displayedFramedUnits.find(
        (displayed) => displayed.Unit === row.Unit && displayed.Attribute === row.Attribute
      );

      if (displayedRow) {
        return {
          ...row,
          "UCUM Code": displayedRow["UCUM Code"],
          "UCUM Label": displayedRow["UCUM Label"],
          Description: displayedRow.Description
        };
      }
      
      return row;
    });
    
    // Auto-populate UCUM codes for all units that don't have them yet
    const framedData = updatedData.map((row) => {
      // If already has UCUM code, preserve it
      if (row["UCUM Code"]) {
        return row;
      }
      
      // Auto-search for UCUM data
      const { firstMatch } = searchUnits(row.Unit);
      return {
        ...row,
        "UCUM Code": firstMatch?.code || "",
        "UCUM Label": firstMatch?.label || "",
        Description: firstMatch?.description || "",
        deleted: false // Clear deleted flag when framing
      };
    });

    setUnitFramedRowData(framedData);

    // tempToDisplayRowData will be auto-updated by useUnitData useEffect
    setFrameAllUnits(true);
  }, [
    unitFramedRowData,
    setFrameAllUnits,
    setUnitFramedRowData
  ]);

  const onGridReady = useOverlayGridOnGridReady(setLoading);

  const showLoading = loading && unitFramedRowData?.length > LOADING_THRESHOLD;
  const hasUnframedUnits = unframedUnitList && unframedUnitList.length > 0;
  const unframedUnitsText =
    !frameAllUnits && hasUnframedUnits
      ? `${t("Unframed units")}: [${unframedUnitList.join(", ")}]`
      : "";

  return (
    <BackNextSkeleton
      isForward
      pageForward={handleForward}
      isBack
      pageBack={() => setCurrentPage("Overlays")}
    >
      {showLoading && <Loading />}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={deleteHandler}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box
        sx={{
          margin: "1rem",
          marginBottom: BETWEEN_SECTION_SPACING,
          gap: "1.25rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.25rem",
            width: "100%"
          }}
        >
          <Box
            sx={{
              textAlign: "center",
              fontSize: "0.9rem",
              color: "text.secondary",
              maxWidth: MAX_TEXT_WIDTH,
              wordWrap: "break-word",
              height: STATUS_AREA_HEIGHT,
              overflowY: "auto",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              width: "100%",
              lineHeight: 1.2
            }}
          >
            {unframedUnitsText}
          </Box>
          <Button
            color="button"
            variant="contained"
            disabled={frameAllUnits || !hasUnframedUnits}
            onClick={handleFrameAllUnits}
            sx={{
              padding: "0.5rem 1rem",
              minWidth: BUTTON_MIN_WIDTH,
              ...((frameAllUnits || !hasUnframedUnits) && buttonDisabledStyles)
            }}
          >
            {frameAllUnits
              ? t("All units are framed")
              : !hasUnframedUnits
                ? t("No units to frame")
                : t("Frame all units")}
          </Button>
        </Box>
        <Box
          className="unit-framing-grid ag-theme-balham ag-grid-compact"
          sx={{
            width: GRID_WIDTH,
            overflow: "hidden",
            "& .ag-root-wrapper": { height: "auto" },
            "& .ag-layout-auto-height .ag-center-cols-clipper": { minHeight: 0 },
            "& .ag-layout-auto-height .ag-center-cols-container": { minHeight: 0 },
            "& .ag-root.ag-layout-auto-height .ag-body-viewport": {
              flex: "0 0 auto",
              height: "auto",
              minHeight: noAttributes ? AG_GRID_EMPTY_NO_ATTRIBUTES_BODY_MIN_PX : 0
            },
            ...(noAttributes ? { minHeight: AG_GRID_EMPTY_NO_ATTRIBUTES_GRID_MIN_PX } : {})
          }}
        >
          <style>{gridStyles}</style>
          <AgGridReact
            key={i18n.language}
            ref={gridRef}
            containerStyle={{ width: "100%", height: "auto" }}
            rowData={tempToDisplayRowData}
            columnDefs={columnDefsWithCallbacks}
            domLayout="autoHeight"
            getRowHeight={getRowHeight}
            suppressHorizontalScroll
            onGridReady={onGridReady}
            overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
          />
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            textAlign: "center",
            mt: 2,
            maxWidth: GRID_WIDTH,
            px: 1,
            lineHeight: 1.5
          }}
        >
          {t("All unit rules are documented in the", {
            defaultValue: "All unit rules are documented in the"
          })}{" "}
          <MuiLink
            href="https://github.com/agrifooddatacanada/UCUM_agri-food_units"
            target="_blank"
            rel="noreferrer"
            underline="hover"
          >
            {t("GitHub repo", { defaultValue: "GitHub repo" })}
          </MuiLink>
          .{" "}
          {t("Request new unit ontologies by", {
            defaultValue: "Request new unit ontologies by"
          })}{" "}
          <MuiLink
            href="https://github.com/agrifooddatacanada/UCUM_agri-food_units/issues"
            target="_blank"
            rel="noreferrer"
            underline="hover"
          >
            {t("raising an issue in the repository", {
              defaultValue: "raising an issue in the repository"
            })}
          </MuiLink>{" "}
          {t("or email us at", { defaultValue: "or email us at" })}{" "}
          <MuiLink href="mailto:adc@uoguelph.ca" underline="hover">
            adc@uoguelph.ca
          </MuiLink>
          .
        </Typography>
      </Box>
    </BackNextSkeleton>
  );
};

export default UnitFraming;
