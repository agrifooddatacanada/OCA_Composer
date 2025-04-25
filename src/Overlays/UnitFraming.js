import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  memo,
  forwardRef
} from "react";
import { Box, IconButton } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { AgGridReact } from "ag-grid-react";
import { useTranslation } from "react-i18next";
import { Context } from "../App";
import "ag-grid-community/styles/ag-theme-balham.css";
import BackNextSkeleton from "../components/BackNextSkeleton";
import CellHeader from "../components/CellHeader";
import { gridStyles, preWrapWordBreak, greyCellStyle } from "../constants/styles";
import TypeTooltip from "../AttributeDetails/TypeTooltip";
import DeleteConfirmation from "./DeleteConfirmation";
import { CustomPalette } from "../constants/customPalette";
import Loading from "../components/Loading";

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

const getColumnDefs = (gridRef, t) => [
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
    editable: false,
    width: 185,
    autoHeight: true,
    cellStyle: () => greyCellStyle,
    headerComponent: () => (
      <CellHeader headerText={t("UCUM Code")} helpText={<TypeTooltip />} />
    )
  },
  {
    field: "UCUM Label",
    editable: false,
    width: 185,
    autoHeight: true,
    cellStyle: () => greyCellStyle,
    headerComponent: () => (
      <CellHeader headerText={t("UCUM Label")} helpText={<TypeTooltip />} />
    )
  },
  {
    field: "Description",
    editable: false,
    width: 185,
    autoHeight: true,
    cellStyle: () => greyCellStyle,
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
  const gridRef = useRef();

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

  const columnDefs = useMemo(() => getColumnDefs(gridRef, t), [t]);

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
            rowData={unitFramingRowData}
            columnDefs={columnDefs}
            domLayout="autoHeight"
            suppressHorizontalScroll={true}
            rowHeight={50}
            onGridReady={onGridReady}
          />
        </Box>
        {/* <Box
          sx={{
            width: "80%"
          }}
        >
          {t("All format rules are documented in the")}{" "}
          <Link
            href="https://github.com/agrifooddatacanada/format_options"
            target="_blank"
            rel="noreferrer"
          >
            {t("format GitHub repository")}
          </Link>
          . {t("Request a new format to be added by")}{" "}
          <Link
            href="https://github.com/agrifooddatacanada/format_options/issues"
            rel="noreferrer"
            target="_blank"
          >
            {t("raising an issue in the repository")}
          </Link>{" "}
          {t("or email us at")} <Link href="mailto:adc@uoguelph.ca">adc@uoguelph.ca</Link>
          .
        </Box> */}
      </Box>
    </BackNextSkeleton>
  );
};

export default UnitFraming;
