import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  memo,
  forwardRef,
  useEffect
} from "react";
import { Box, IconButton } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { AgGridReact } from "ag-grid-react";
import { useTranslation } from "react-i18next";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import "ag-grid-community/styles/ag-theme-balham.css";
import BackNextSkeleton from "../components/BackNextSkeleton";
import CellHeader from "../components/CellHeader";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import TypeTooltip from "../AttributeDetails/TypeTooltip";
import DeleteConfirmation from "./DeleteConfirmation";
import { CustomPalette } from "../constants/customPalette";
import Loading from "../components/Loading";
import ucumUnits from "../constants/ucumUnits";
import AutoCompleteEditor from "../components/AutoCompleteEditor";
import { Context } from "../App";

// TODO: fix the grid styles: handle the last column border
// The width of the columns are the defined based on the sx={{ width: 705 }}: find a dynamic way to set the width
const TrashCanButton = memo(
  // eslint-disable-next-line no-unused-vars
  forwardRef((props, ref) => {
    const onClick = useCallback(() => {
      props.node.updateData({
        ...props.node.data,
        "UCUM Code": "",
        "UCUM Label": "",
        Description: ""
      });
      props?.onRefresh();
    }, []);

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
    cellEditor: AutoCompleteEditor,
    cellEditorParams: {
      options: [],
      search: debounce((inputValue, callback) => {
        const { results } = searchUnits(inputValue || "");
        callback(results.map((item) => item.code));
      }, 200)
    },
    singleClickEdit: true,
    editable: true,
    headerComponent: () => (
      <CellHeader headerText={t("UCUM Code")} helpText={<TypeTooltip />} />
    ),
    onCellValueChanged: (params) => {
      const selectedCode = params.newValue;
      const { results } = searchUnits(selectedCode || "");

      const selectedItem = results.find((item) => item.code === selectedCode);

      if (selectedItem) {
        params.node.setData({
          ...params.data,
          "UCUM Code": selectedItem.code,
          "UCUM Label": selectedItem.label,
          Description: selectedItem.description
        });
      }
    }
  },
  {
    field: "UCUM Label",
    editable: false,
    width: 185,
    autoHeight: true,
    headerComponent: () => (
      <CellHeader headerText={t("UCUM Label")} helpText={<TypeTooltip />} />
    )
  },
  {
    field: "Description",
    editable: false,
    width: 185,
    autoHeight: true,
    headerComponent: () => (
      <CellHeader headerText={t("Description")} helpText={<TypeTooltip />} />
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

const UnitFraming = () => {
  const { t } = useTranslation();
  const {
    setCurrentPage,
    setSelectedOverlay,
    unitFramingRowData,
    // characterEncodingRowData,
    // setCharacterEncodingRowData,
    setOverlay,
    setUnitFramingRowData
  } = useContext(Context);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rowData, setRowData] = useState([]);
  const gridRef = useRef();

  const options = {
    keys: ["code", "label", "description"]
    // isCaseSensitive: true,
    // includeScore: true,
    // includeMatches: true,
    // minMatchCharLength: 1,
    // shouldSort: true,
    // threshold: 0.4,
    // distance: 100
  };

  const fuse = useMemo(() => new Fuse(ucumUnits, options), [ucumUnits, options]);
  const searchUnits = useCallback(
    (unit) => {
      const searchResults = fuse.search(unit.toString());
      const slicedResults = searchResults.slice(0, 20).map((result) => result.item);

      // Remove duplicates using a Set
      const uniqueResults = Array.from(
        new Set(slicedResults.map((item) => item.code))
      ).map((code) => slicedResults.find((item) => item.code === code));

      return {
        firstMatch: uniqueResults[0] || null,
        results: uniqueResults
      };
    },
    [fuse]
  );
  useEffect(() => {
    if (unitFramingRowData?.length > 0) {
      const updatedRowData = unitFramingRowData.map((row) => {
        const { firstMatch } = searchUnits(row.Unit);
        return {
          ...row,
          "UCUM Code": firstMatch?.code || row["UCUM Code"],
          "UCUM Label": firstMatch?.label || row["UCUM Label"],
          Description: firstMatch?.description || row.Description
        };
      });
      setRowData(updatedRowData);
    } else {
      setRowData([]);
    }
  }, []);

  const handleDeleteCurrentOverlay = () => {
    setOverlay((prev) => ({
      ...prev,
      "Unit Framing": { feature: "Unit Framing", selected: false }
    }));

    // Delete attribute from characterEncodingRowData
    // const newCharacterEncodingRowData = characterEncodingRowData.map((row) => {
    //   delete row["Add format rule for data"];
    //   return row;
    // });

    // setCharacterEncodingRowData(newCharacterEncodingRowData);
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  const handleSave = () => {
    gridRef.current.api.stopEditing();
    const newUnitFramingData = gridRef.current.api
      .getRenderedNodes()
      ?.map((node) => node?.data);
    setUnitFramingRowData(newUnitFramingData);
  };

  const handleForward = () => {
    handleSave();
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  const columnDefs = useMemo(
    () => getColumnDefs(gridRef, t, searchUnits),
    [t, searchUnits]
  );

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
      {loading && unitFramingRowData?.length > 40 && <Loading />}
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
            rowData={rowData}
            columnDefs={columnDefs}
            domLayout="autoHeight"
            suppressHorizontalScroll={true}
            rowHeight={50}
            onGridReady={onGridReady}
          />
        </Box>
      </Box>
    </BackNextSkeleton>
  );
};

export default UnitFraming;
