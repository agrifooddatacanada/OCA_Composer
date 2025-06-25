import React, {
  useCallback,
  useContext,
  useRef,
  useState,
  memo,
  forwardRef,
  useEffect,
  useImperativeHandle
} from "react";
import { Box, IconButton, TextField, Autocomplete, Popper, Link } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-balham.css";
import { useTranslation } from "react-i18next";
import { styled } from "@mui/material/styles";
import BackNextSkeleton from "../components/BackNextSkeleton";
import CellHeader from "../components/CellHeader";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import DeleteConfirmation from "./DeleteConfirmation";
import { CustomPalette } from "../constants/customPalette";
import Loading from "../components/Loading";
import { searchUnits } from "../constants/utils";
import { Context } from "../App";

// TODO: fix the grid styles: handle the last column border
// The width of the columns are the defined based on the sx={{ width: 705 }}: find a dynamic way to set the width

const TrashCanButton = memo(
  // eslint-disable-next-line no-unused-vars
  forwardRef((props, ref) => {
    const { setUnitFramedRowData } = useContext(Context);

    const onClick = useCallback(() => {
      setUnitFramedRowData((prev) =>
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.node.data, setUnitFramedRowData]);

    return (
      <IconButton
        sx={{
          pr: 1,
          color: CustomPalette.GREY_600,
          transition: "all 0.2s ease-in-out",
          display: props.node.data?.Unit === "" ? "none" : "block"
        }}
        onClick={onClick}
      >
        <DeleteOutlineIcon />
      </IconButton>
    );
  })
);

const allowOverflowStyle = {
  ...preWrapWordBreak,
  overflow: "auto"
};

const CustomPopper = styled(Popper)(() => ({ width: "100%" }));

const UnitFramingAutoCompleteEditor = forwardRef(
  ({ search, value, initialOptions }, ref) => {
    const [options, setOptions] = useState(initialOptions || []);
    const [autoValue, setAutoValue] = useState(value || "");

    const inputRef = useRef({ value });

    const onOptionSelected = (event, newValue) => {
      setAutoValue(newValue);
      inputRef.current.value = newValue;

      if (ref && ref.current) {
        ref.current.api.stopEditing();
      }
    };

    const onInputChangeHandler = (event, newInputValue) => {
      setAutoValue(newInputValue);
      search(newInputValue, (newOptions) => {
        setOptions(newOptions);

        // Check for exact match
        const exactMatch = newOptions.find((option) => option === newInputValue);
        if (exactMatch) {
          // Manually trigger the onChange event
          onOptionSelected(event, exactMatch);
        }
      });
    };

    const onKeyDownHandler = (event) => {
      if (event.key === "Enter") {
        const exactMatch = options.find((option) => option === autoValue);
        if (exactMatch) {
          onOptionSelected(event, exactMatch);
        }
      }
    };

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
  }
);

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

const getColumnDefs = (gridRef, t, searchUnits) => [
  {
    field: "Unit",
    editable: false,
    width: 100,
    cellStyle: () => allowOverflowStyle,
    headerComponent: () => (
      <CellHeader headerText={t("Unit")} helpText={t("The units defined in schema")} />
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
      <CellHeader headerText={t("UCUM Description")} helpText={t("UCUM Description")} />
    )
  },
  {
    headerName: "",
    field: "Delete",
    cellRendererFramework: TrashCanButton,
    width: 48,
    cellRendererParams: (params) => ({
      onRefresh: () => {
        gridRef.current.api.redrawRows({ rowNodes: [params.node] });
      }
    })
  }
];

const updateUnitFramedRowData = (unitFramedRowData, displayedFramedUnits) =>
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

const UnitFraming = () => {
  const { t } = useTranslation();
  const {
    setCurrentPage,
    setSelectedOverlay,
    unitFramedRowData,
    setUnitFramedRowData,
    setOverlay
  } = useContext(Context);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [tempToDisplayRowData, setTempToDisplayRowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef();

  useEffect(() => {
    // step1: create a set for only unique units to process what needs to be displayed
    const unitFramedRowDataSet = Array.from(
      new Map(unitFramedRowData.map((row) => [row.Unit, row])).values()
    );

    // step2: filter the unitFramedRowDataSet to only include the units that are not deleted by the user (i.e., deleted: false)
    const filteredUnitFramedRowData = unitFramedRowDataSet.filter((row) => {
      const toDisplayRow = unitFramedRowData.find(
        (displayRow) => displayRow.Attribute === row.Attribute && !displayRow.deleted
      );
      return !!toDisplayRow;
    });

    // step3: set the tempToDisplayRowData to the filteredUnitFramedRowData
    setTempToDisplayRowData(filteredUnitFramedRowData);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteCurrentOverlay = () => {
    setOverlay((prev) => ({
      ...prev,
      "Unit Framing": { feature: "Unit Framing", selected: false }
    }));

    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  const handleSave = () => {
    gridRef.current.api.stopEditing();
    const displayedFramedUnits = gridRef.current.api
      .getRenderedNodes()
      ?.map((node) => node?.data);

    setUnitFramedRowData(
      updateUnitFramedRowData(unitFramedRowData, displayedFramedUnits)
    );
  };

  const handleForward = () => {
    handleSave();
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  const columnDefs = getColumnDefs(gridRef, t, searchUnits);

  const onGridReady = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <BackNextSkeleton
      isForward
      pageForward={handleForward}
      isBack
      pageBack={() => setShowDeleteConfirmation(true)}
      backText="Remove overlay"
    >
      {loading && unitFramedRowData?.length > 40 && <Loading />}
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
          alignItems: "center"
        }}
      >
        <Box className="ag-theme-balham" sx={{ width: 705 }}>
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
        <Box
          sx={{
            width: "80%"
          }}
        >
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
