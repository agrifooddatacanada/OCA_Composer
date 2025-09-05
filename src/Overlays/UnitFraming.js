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
  IconButton,
  TextField,
  Autocomplete,
  Popper,
  Link,
  Button
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-balham.css";
import { useTranslation } from "react-i18next";
import { styled } from "@mui/material/styles";
import BackNextSkeleton from "../components/BackNextSkeleton";
import CellHeader from "../components/CellHeader";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import DeleteConfirmation from "./DeleteConfirmation";
import CustomPalette from "../constants/customPalette";
import Loading from "../components/Loading";
import { searchUnits } from "../constants/utils";
import { Context } from "../App";

const GRID_WIDTH = 705;
const LOADING_THRESHOLD = 40;
const BUTTON_MIN_WIDTH = "150px";
const MAX_TEXT_WIDTH = "600px";

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
    const sourceData = currentUnitFramedRowData;

    // Create unique units map
    const unitFramedRowDataSet = Array.from(
      new Map(sourceData.map((row) => [row.Unit, row])).values()
    );

    // Filter out deleted units
    const filteredUnitFramedRowData = unitFramedRowDataSet.filter((row) => {
      const toDisplayRow = unitFramedRowDataSet.find(
        (displayRow) => displayRow.Attribute === row.Attribute && !displayRow.deleted
      );
      return !!toDisplayRow;
    });

    setTempToDisplayRowData(filteredUnitFramedRowData);
  }, [currentUnitFramedRowData]);

  useEffect(() => {
    processUnitData();
  }, [processUnitData]);

  return { tempToDisplayRowData, setTempToDisplayRowData, processUnitData };
};

const TrashCanButton = memo((props) => {
  const { setCurrentUnitFramedRowData } = useContext(Context);

  const handleDelete = useCallback(() => {
    setCurrentUnitFramedRowData((prev) =>
      prev.map((row) =>
        row.Unit === props.node.data.Unit ? { ...row, deleted: true } : row
      )
    );

    props.node.updateData({
      ...props.node.data,
      "UCUM Code": "",
      "UCUM Label": "",
      Description: ""
    });

    props?.onRefresh();
  }, [props.node.data, setCurrentUnitFramedRowData, props]);

  const isVisible = props.node.data?.Unit !== "";

  return (
    <IconButton
      sx={{
        pr: 1,
        color: CustomPalette.GREY_600,
        transition: "all 0.2s ease-in-out",
        display: isVisible ? "block" : "none"
      }}
      onClick={handleDelete}
    >
      <DeleteOutlineIcon />
    </IconButton>
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

const createOnCellValueChanged = (searchUnits, key) => (params) => {
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
  }
};

const updateUnits = (unitFramedRowData, displayedFramedUnits) =>
  unitFramedRowData.map((row) => {
    const displayedRow = displayedFramedUnits.find(
      (displayed) => displayed.Unit === row.Unit
    );

    return displayedRow
      ? {
          ...row,
          "UCUM Code": displayedRow["UCUM Code"],
          "UCUM Label": displayedRow["UCUM Label"],
          Description: displayedRow.Description
        }
      : row;
  });

const useColumnDefs = (gridRef, t) =>
  useMemo(
    () => [
      {
        field: "Unit",
        editable: false,
        width: 100,
        cellStyle: () => allowOverflowStyle,
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
        autoHeight: true,
        cellStyle: () => allowOverflowStyle,
        cellEditor: UnitFramingAutoCompleteEditor,
        cellEditorParams: createCellEditorParams(searchUnits, "code"),
        singleClickEdit: true,
        editable: true,
        onCellValueChanged: createOnCellValueChanged(searchUnits, "code"),
        headerComponent: () => (
          <CellHeader headerText={t("UCUM Code")} helpText={t("UCUM Code")} />
        )
      },
      {
        field: "UCUM Label",
        width: 185,
        autoHeight: true,
        cellStyle: () => allowOverflowStyle,
        cellEditor: UnitFramingAutoCompleteEditor,
        cellEditorParams: createCellEditorParams(searchUnits, "label"),
        singleClickEdit: true,
        editable: true,
        onCellValueChanged: createOnCellValueChanged(searchUnits, "label"),
        headerComponent: () => (
          <CellHeader headerText={t("UCUM Label")} helpText={t("UCUM Label")} />
        )
      },
      {
        field: "Description",
        width: 185,
        autoHeight: true,
        cellStyle: () => allowOverflowStyle,
        cellEditor: UnitFramingAutoCompleteEditor,
        cellEditorParams: createCellEditorParams(searchUnits, "description"),
        singleClickEdit: true,
        editable: true,
        onCellValueChanged: createOnCellValueChanged(searchUnits, "description"),
        headerComponent: () => (
          <CellHeader
            headerText={t("UCUM Description")}
            helpText={t("UCUM Description")}
          />
        )
      },
      {
        headerName: "",
        field: "Delete",
        cellRendererFramework: TrashCanButton,
        width: 48,
        cellRendererParams: (params) => ({
          onRefresh: () => {
            gridRef.current?.api?.redrawRows({ rowNodes: [params.node] });
          }
        })
      }
    ],
    [t, gridRef]
  );

const UnitFraming = () => {
  const { t } = useTranslation();
  const {
    setCurrentPage,
    setSelectedOverlay,
    setOverlay,
    unitFramedRowData,
    setUnitFramedRowData,
    frameAllUnits,
    setFrameAllUnits,
    currentUnitFramedRowData,
    setCurrentUnitFramedRowData,
    unframedUnitList
  } = useContext(Context);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef();

  const { tempToDisplayRowData, setTempToDisplayRowData } = useUnitData(
    currentUnitFramedRowData
  );

  const columnDefs = useColumnDefs(gridRef, t);

  const handleDeleteCurrentOverlay = useCallback(() => {
    setOverlay((prev) => ({
      ...prev,
      "Unit Framing": { feature: "Unit Framing", selected: false }
    }));
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  }, [setOverlay, setSelectedOverlay, setCurrentPage]);

  const handleSave = useCallback(() => {
    gridRef.current?.api?.stopEditing();
    const displayedFramedUnits =
      gridRef.current?.api?.getRenderedNodes()?.map((node) => node?.data) || [];

    // Update currentUnitFramedRowData with only displayed data
    setCurrentUnitFramedRowData((prev) => updateUnits(prev, displayedFramedUnits));

    // Update unitFramedRowData with the final framed data
    const finalUnitFramedRowData = updateUnits(unitFramedRowData, displayedFramedUnits);
    setUnitFramedRowData(finalUnitFramedRowData);
  }, [unitFramedRowData, setUnitFramedRowData, setCurrentUnitFramedRowData]);

  const handleForward = useCallback(() => {
    handleSave();
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  }, [handleSave, setSelectedOverlay, setCurrentPage]);

  const handleFrameAllUnits = useCallback(() => {
    gridRef.current?.api?.stopEditing();
    const displayedFramedUnits =
      gridRef.current?.api?.getRenderedNodes()?.map((node) => node?.data) || [];

    const updatedCurrentUnitFramedRowData = updateUnits(
      currentUnitFramedRowData,
      displayedFramedUnits
    );
    setCurrentUnitFramedRowData(updatedCurrentUnitFramedRowData);

    const eligibleData = updatedCurrentUnitFramedRowData.filter((row) => !row.deleted);

    setTempToDisplayRowData(eligibleData);
    setFrameAllUnits(true);
  }, [
    currentUnitFramedRowData,
    setFrameAllUnits,
    setCurrentUnitFramedRowData,
    setTempToDisplayRowData
  ]);

  const onGridReady = useCallback(() => {
    setLoading(false);
  }, []);

  const showLoading = loading && unitFramedRowData?.length > LOADING_THRESHOLD;
  const hasUnframedUnits = unframedUnitList && unframedUnitList.length > 0;
  const unframedUnitsText = frameAllUnits
    ? t("All units are framed")
    : hasUnframedUnits
      ? `${t("Unframed units")}: [${unframedUnitList.join(", ")}]`
      : t("No units to frame");

  return (
    <BackNextSkeleton
      isForward
      pageForward={handleForward}
      isBack
      pageBack={() => setShowDeleteConfirmation(true)}
      backText="Remove overlay"
    >
      {showLoading && <Loading />}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={handleDeleteCurrentOverlay}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box
        sx={{
          margin: "2rem",
          gap: "2rem",
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
            gap: "0.75rem",
            width: "100%"
          }}
        >
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
          <Box
            sx={{
              textAlign: "center",
              fontSize: "0.9rem",
              color: "text.secondary",
              maxWidth: MAX_TEXT_WIDTH,
              wordWrap: "break-word"
            }}
          >
            {unframedUnitsText}
          </Box>
        </Box>
        <Box className="ag-theme-balham" sx={{ width: GRID_WIDTH }}>
          <style>{gridStyles}</style>
          <AgGridReact
            ref={gridRef}
            rowData={tempToDisplayRowData}
            columnDefs={columnDefs}
            domLayout="autoHeight"
            suppressHorizontalScroll
            rowHeight={50}
            onGridReady={onGridReady}
          />
        </Box>
        <Box sx={{ width: "80%" }}>
          {t("All unit rules are documented in the")}{" "}
          <Link
            href="https://github.com/agrifooddatacanada/UCUM_agri-food_units"
            target="_blank"
            rel="noreferrer"
          >
            {t("units GitHub repository")}
          </Link>
          . {t("Request new unit ontologies to be added by")}{" "}
          <Link
            href="https://github.com/agrifooddatacanada/UCUM_agri-food_units/issues"
            rel="noreferrer"
            target="_blank"
          >
            {t("raising an issue in the repository")}
          </Link>{" "}
          {t("or email us at")} <Link href="mailto:adc@uoguelph.ca">adc@uoguelph.ca</Link>
          .
        </Box>
      </Box>
    </BackNextSkeleton>
  );
};

export default UnitFraming;
