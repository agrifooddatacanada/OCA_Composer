// TODO: change to framing_justification instead of mapping_justification.
// !Important: in generating extension input object if the term_id is empty we don't include it.
// TODO: imnplement a similar solution like in unit framing using a boolean flag.

import React, {
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback
} from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  IconButton,
  Modal,
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  CircularProgress
} from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import SearchIcon from "@mui/icons-material/Search";
import { Context } from "../App";
import BackNextSkeleton from "../components/BackNextSkeleton";
import CellHeader from "../components/CellHeader";
import Spinner from "../components/Spinner";
import OntologyTreeView from "../components/OntologyTreeView";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import DeleteConfirmation from "./DeleteConfirmation";
import {
  FIELD_ATTRIBUTE_FRAMING_OVERLAY,
  ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS
} from "../constants/constants";
import { CustomPalette } from "../constants/customPalette";
import {
  matchedSubjectAndPredicate,
  searchPredicates,
  fetchClassHierarchy
} from "../constants/utils";

let globalGridRef = null;

const BUTTON_MIN_WIDTH = "150px";
const MAX_TEXT_WIDTH = "600px";

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

const logError = (message, error) => {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(message, error);
  }
};

const logWarn = (message, error) => {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(message, error);
  }
};

const EmptyHeaderRenderer = () => <div />;

const TruncatedTextCellRenderer = ({ value, maxLength = 35 }) => {
  const displayText =
    value && value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;
  const isTruncated = value && value.length > maxLength;

  return (
    <div
      title={isTruncated ? value : undefined}
      style={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "clip",
        padding: "6px 8px",
        fontSize: "12px",
        lineHeight: "1.2",
        color: "inherit",
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        height: "100%",
        maxWidth: "100%",
        cursor: "default"
      }}
    >
      {displayText}
    </div>
  );
};

const TermCellRenderer = ({ value }) => (
  <TruncatedTextCellRenderer value={value} maxLength={15} />
);

const DescriptionCellRenderer = ({ value }) => (
  <TruncatedTextCellRenderer value={value} maxLength={35} />
);

const DropdownCellRenderer = ({
  value,
  rowIndex,
  fieldName,
  options,
  maxTextLength = 25
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

const TypeOfMatchCellRenderer = (props) => (
  <DropdownCellRenderer
    {...props}
    fieldName="typeOfMatch"
    options={ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.typeOfMatch}
    maxTextLength={25}
  />
);

const MappingJustificationCellRenderer = (props) => (
  <DropdownCellRenderer
    {...props}
    fieldName="mappingJustification"
    options={ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.mappingJustification}
    maxTextLength={30}
  />
);

const CheckboxRenderer = (props) => {
  const { value, rowIndex, colDef, onSelectionChange } = props;
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current.checked = value;
  }, [value]);

  const handleChange = (event) => {
    const { checked } = event.target;
    if (globalGridRef && globalGridRef.current && globalGridRef.current.api) {
      const node = globalGridRef.current.api.getRowNode(rowIndex);
      if (node) {
        if (checked) {
          const allNodes = globalGridRef.current.api.getRenderedNodes();
          allNodes.forEach((node, index) => {
            if (index !== rowIndex) {
              node.setDataValue(colDef.field, false);
            }
          });
          if (onSelectionChange) {
            onSelectionChange(node.data);
          }
        } else if (onSelectionChange) {
          onSelectionChange(null);
        }
        node.setDataValue(colDef.field, checked);
      }
    }
  };

  return <input type="checkbox" ref={inputRef} onChange={handleChange} />;
};

const toDisplayRowData = (results) =>
  results.map((result) => ({
    id: result?.id || result?.uri || "",
    term: result.label || result.term || "",
    description: result.definition || result.description || "",
    typeOfMatch: ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.typeOfMatch[0]?.value,
    mappingJustification:
      ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.mappingJustification[0]?.value,
    uri: result?.uri || result?.id || "",
    subClassOf: result?.subClassOf || []
  }));

const EditAttributeFramingModal = ({ open, onClose, onSave, editingRowData }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allpages, setAllpages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedTermForExploring, setSelectedTermForExploring] = useState(null);
  const [hierarchyData, setHierarchyData] = useState(null);
  const [hierarchyError, setHierarchyError] = useState(null);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);
  const gridRef = useRef();
  const selectedHierarchyNode = hierarchyData?.selected;
  const displayTermLabel =
    selectedHierarchyNode?.label || selectedTermForExploring?.term || "";
  const displayTermDescription =
    selectedHierarchyNode?.definition ||
    selectedHierarchyNode?.description ||
    selectedTermForExploring?.description ||
    "";

  useEffect(() => {
    if (editingRowData && editingRowData.Attribute) {
      setSearchTerm(editingRowData.Attribute);
      setSearchResults([]);
      setCurrentPage(1);
      setAllpages(1);
      setTotalResults(0);
    }
  }, [editingRowData]);

  // Fetch hierarchy data when a term is selected
  useEffect(() => {
    const classId =
      selectedTermForExploring?.uri ||
      selectedTermForExploring?.id ||
      selectedTermForExploring?.objectId ||
      "";

    if (!classId) {
      setHierarchyData(null);
      setHierarchyError(null);
      setIsLoadingHierarchy(false);
      return;
    }

    const controller = new AbortController();

    const loadHierarchy = async () => {
      setIsLoadingHierarchy(true);
      setHierarchyError(null);

      try {
        const response = await fetchClassHierarchy({
          classId,
          maxDepth: 2,
          includeSiblings: true,
          signal: controller.signal
        });

        if (!controller.signal.aborted) {
          setHierarchyData(response);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        logError("Failed to fetch class hierarchy:", error);
        setHierarchyData(null);
        setHierarchyError(error?.message || "Unable to load hierarchy data");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingHierarchy(false);
        }
      }
    };

    loadHierarchy();

    return () => {
      controller.abort();
    };
  }, [selectedTermForExploring]);

  const handleSearch = async (page = 1) => {
    if (!searchTerm.trim()) {
      return;
    }

    setIsSearching(true);

    try {
      const response = await searchPredicates({
        page,
        pageSize: 17,
        query: searchTerm
      });

      const { results, totalResults } = response;
      const resultsData = toDisplayRowData(results);
      const calculatedAllpages = Math.ceil(totalResults / 15);

      setSearchResults(resultsData);
      setCurrentPage(page);
      setAllpages(calculatedAllpages);
      setTotalResults(totalResults);
      globalGridRef = gridRef;
    } catch (error) {
      logError("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchButtonClick = () => {
    handleSearch(1);
  };

  const handleNextPage = () => {
    if (currentPage < allpages) {
      handleSearch(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handleSearch(currentPage - 1);
    }
  };

  const handleSave = () => {
    // Find the selected row by checking which row has selected: true
    const selectedRow = searchResults.find((row) => row.selected === true);
    if (selectedRow) {
      onSave(selectedRow);
    }
    onClose();
  };

  const searchResultsColumnDefs = useMemo(
    () => [
      {
        field: "selected",
        headerName: "",
        width: 50,
        autoHeight: true,
        cellRenderer: CheckboxRenderer,
        cellRendererParams: {
          gridRef: globalGridRef,
          onSelectionChange: setSelectedTermForExploring
        },
        headerComponent: EmptyHeaderRenderer
      },
      {
        field: "term",
        headerName: "Term",
        width: 130,
        autoHeight: true,
        cellRenderer: TermCellRenderer,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Term"),
          helpText: t("The term name or label")
        }
      },
      {
        field: "description",
        headerName: "Description",
        width: 230,
        autoHeight: true,
        cellRenderer: DescriptionCellRenderer,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Description"),
          helpText: t("Definition")
        }
      },
      {
        field: "typeOfMatch",
        headerName: "Type of Match",
        width: 130,
        autoHeight: true,
        cellStyle: preWrapWordBreak,
        cellRenderer: TypeOfMatchCellRenderer,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Type of Match"),
          helpText: t("Mapping vocabulary ...")
        }
      },
      {
        field: "mappingJustification",
        headerName: "Framing Justification",
        width: 220,
        autoHeight: true,
        cellStyle: preWrapWordBreak,
        cellRenderer: MappingJustificationCellRenderer,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Framing Justification"),
          helpText: t("Framing Justification")
        }
      }
    ],
    [t]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="edit-attribute-framing-modal"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        backdropFilter: "blur(4px)",
        backgroundColor: "rgba(0, 0, 0, 0.3)"
      }}
    >
      <Paper
        sx={{
          width: { xs: "95vw", sm: "90vw" },
          maxWidth: 1400,
          maxHeight: "90vh",
          overflow: "auto",
          p: { xs: 2, sm: 3 }
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{ color: CustomPalette.PRIMARY, mb: 3 }}
        >
          {t("Edit or Add terms")}
        </Typography>

        <Grid container spacing={3}>
          {/* Left Box - Search */}
          <Grid item xs={12} md={7}>
            <Paper
              sx={{
                p: { xs: 2, sm: 3 },
                height: { xs: "60vh", md: "70vh" },
                border: `1px solid ${CustomPalette.GREY_300}`,
                boxShadow: "none"
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: CustomPalette.PRIMARY, mb: 2 }}
              >
                {t("Term to frame")}: {editingRowData?.Attribute || "Search Terms"}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Grid container spacing={4}>
                  <Grid item xs={12} sm={8} md={9}>
                    <TextField
                      fullWidth
                      placeholder={t("Search for terms...")}
                      // value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "40px",
                          "&:hover fieldset": {
                            borderColor: CustomPalette.PRIMARY
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: CustomPalette.PRIMARY
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} md={3}>
                    <Button
                      variant="contained"
                      onClick={handleSearchButtonClick}
                      disabled={isSearching}
                      startIcon={
                        isSearching ? (
                          <CircularProgress
                            size={20}
                            sx={{ color: CustomPalette.PRIMARY }}
                          />
                        ) : (
                          <SearchIcon sx={{ width: "20px", height: "20px" }} />
                        )
                      }
                      fullWidth
                      sx={{
                        height: "40px",
                        minWidth: { xs: "100%", sm: "80px" },
                        backgroundColor: CustomPalette.PRIMARY,
                        // gap: 1.5,
                        "&:hover": {
                          backgroundColor: CustomPalette.SECONDARY
                        },
                        "&:disabled": {
                          backgroundColor: CustomPalette.GREY_300
                        }
                      }}
                    >
                      {isSearching ? "" : t("Search")}
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {/* Search Results Grid */}
              <Box sx={{ height: "calc(70vh - 200px)" }}>
                <div
                  className="ag-theme-balham"
                  style={{ width: "100%", maxWidth: "100%" }}
                >
                  <style>{gridStyles}</style>
                  <style>{`
                    .ag-theme-balham .ag-row:hover {
                      background-color: ${CustomPalette.PINK_100} !important;
                    }
                  `}</style>
                  <AgGridReact
                    ref={gridRef}
                    rowData={searchResults}
                    columnDefs={searchResultsColumnDefs}
                    domLayout="autoHeight"
                    stopEditingWhenCellsLoseFocus
                    onGridReady={() => {
                      globalGridRef = gridRef;
                    }}
                    rowHeight={30}
                    headerHeight={30}
                    suppressHorizontalScroll
                    getRowStyle={(params) => {
                      // Check if the checkbox is actually selected in the row data
                      const isSelected = params.data && params.data.selected === true;
                      return {
                        backgroundColor: isSelected ? CustomPalette.PINK_200 : "white",
                        transition: "background-color 0.2s ease-in-out"
                      };
                    }}
                  />
                </div>
              </Box>

              {/* Pagination Controls */}
              {searchResults.length > 0 && (
                <Box
                  sx={{
                    mt: 4,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <Typography variant="body2" color="textSecondary" mt={4}>
                    Page {currentPage} of {allpages} ({totalResults} total results)
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mt: 4 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handlePreviousPage}
                      disabled={currentPage <= 1}
                      sx={{
                        borderColor: CustomPalette.PRIMARY,
                        color: CustomPalette.PRIMARY,
                        "&:hover": {
                          borderColor: CustomPalette.SECONDARY,
                          backgroundColor: CustomPalette.PINK_200
                        },
                        "&:disabled": {
                          borderColor: CustomPalette.GREY_300,
                          color: CustomPalette.GREY_500
                        }
                      }}
                    >
                      {t("Previous")}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleNextPage}
                      disabled={currentPage >= allpages}
                      sx={{
                        borderColor: CustomPalette.PRIMARY,
                        color: CustomPalette.PRIMARY,
                        "&:hover": {
                          borderColor: CustomPalette.SECONDARY,
                          backgroundColor: CustomPalette.PINK_200
                        },
                        "&:disabled": {
                          borderColor: CustomPalette.GREY_300,
                          color: CustomPalette.GREY_500
                        }
                      }}
                    >
                      {t("Next")}
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Right Box - Explore Terms */}
          <Grid item xs={12} md={5}>
            <Paper
              sx={{
                p: { xs: 2, sm: 3 },
                height: { xs: "50vh", md: "70vh" },
                border: `1px solid ${CustomPalette.GREY_300}`,
                boxShadow: "none"
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: CustomPalette.PRIMARY, mb: 2 }}
              >
                {t("Explore Terms")}
              </Typography>
              <Box
                sx={{
                  height: "calc(70vh - 80px)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {selectedTermForExploring && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                      {displayTermLabel}
                    </Typography>
                    {displayTermDescription && (
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", mb: 0.5 }}
                      >
                        {displayTermDescription}
                      </Typography>
                    )}
                    {selectedHierarchyNode?.id && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#888",
                          fontFamily: "monospace",
                          display: "block"
                        }}
                      >
                        {selectedHierarchyNode.id}
                      </Typography>
                    )}
                  </Box>
                )}
                <Box sx={{ flexGrow: 1 }}>
                  <OntologyTreeView
                    selectedTerm={selectedTermForExploring}
                    hierarchyData={hierarchyData}
                    isLoading={isLoadingHierarchy}
                    errorMessage={hierarchyError}
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              borderColor: CustomPalette.PRIMARY,
              color: CustomPalette.PRIMARY,
              "&:hover": {
                borderColor: CustomPalette.SECONDARY,
                backgroundColor: CustomPalette.PINK_200
              }
            }}
          >
            {t("Cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              backgroundColor: CustomPalette.PRIMARY,
              "&:hover": {
                backgroundColor: CustomPalette.SECONDARY
              }
            }}
          >
            {t("Save Changes")}
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
};

const EditButton = ({ node, onEdit }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <IconButton
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit(node.rowIndex)}
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

const updateFramedAttributes = (attributeFramingRowData, displayedFramedAttributes) =>
  attributeFramingRowData.map((row) => {
    const displayedRow = displayedFramedAttributes.find(
      (displayed) => displayed.Attribute === row.Attribute
    );

    return displayedRow
      ? {
          ...row,
          objectId: displayedRow.objectId,
          description: displayedRow.description,
          mappingJustification: displayedRow.mappingJustification,
          predicateId: displayedRow.predicateId
        }
      : row;
  });

const AttributeFraming = () => {
  const {
    attributeFramingRowData,
    setAttributeFramingRowData,
    setCurrentPage,
    setSelectedOverlay,
    setOverlay,
    frameAllAttributes,
    setFrameAllAttributes,
    unframedAttributeList,
    setUnframedAttributeList
  } = useContext(Context);

  const { t } = useTranslation();
  const gridRef = useRef();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isLoadingPredicates, setIsLoadingPredicates] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [gridReady, setGridReady] = useState(false);

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
      if (allFramed && attributeFramingRowData.length > 0) {
        setFrameAllAttributes(true);
      }
    }
  }, [attributeFramingRowData, setUnframedAttributeList, setFrameAllAttributes]);

  const handleFrameAllAttributes = useCallback(async () => {
    if (!gridReady || !gridRef.current?.api) {
      logWarn("Grid not ready for frame all attributes operation");
      return;
    }

    setIsLoadingPredicates(true);

    try {
      gridRef.current.api.stopEditing();
    } catch (error) {
      logWarn("Error stopping grid editing:", error);
    }

    const displayedFramedAttributes =
      gridRef.current?.api?.getRenderedNodes()?.map((node) => node?.data) || [];

    // Update with any current changes from the grid
    const updatedAttributeFramingRowData = updateFramedAttributes(
      attributeFramingRowData,
      displayedFramedAttributes
    );

    // Frame only unframed attributes (those without objectId)
    const promises = updatedAttributeFramingRowData.map(async (row) => {
      if (row.Attribute && !row.objectId) {
        try {
          const matchedResult = await matchedSubjectAndPredicate({
            page: 1,
            pageSize: 1,
            query: row.Attribute
          });

          if (matchedResult) {
            return {
              ...row,
              objectId: matchedResult.label || "",
              description: matchedResult.definition || "",
              predicateId: "skos:exactMatch",
              mappingJustification: "semapv:ManualMappingCuration"
            };
          }
        } catch (error) {
          // No match found for subject - handled gracefully
        }
      }
      return row;
    });

    const finalRowData = await Promise.all(promises);

    setAttributeFramingRowData(finalRowData);
    setFrameAllAttributes(true);

    setTimeout(() => {
      setIsLoadingPredicates(false);
    }, 500);
  }, [
    setAttributeFramingRowData,
    setFrameAllAttributes,
    attributeFramingRowData,
    gridReady
  ]);

  const handleEdit = useCallback((rowIndex) => {
    setEditingRowIndex(rowIndex);
    setShowEditModal(true);
  }, []);

  const handleDelete = useCallback(
    (rowIndex) => {
      const updatedRowData = attributeFramingRowData.filter(
        (_, index) => index !== rowIndex
      );

      setAttributeFramingRowData(updatedRowData);

      if (editingRowIndex !== null && editingRowIndex > rowIndex) {
        setEditingRowIndex(editingRowIndex - 1);
      }
    },
    [attributeFramingRowData, editingRowIndex, setAttributeFramingRowData]
  );

  const handleEditSave = (selectedItem) => {
    if (selectedItem && editingRowIndex !== null) {
      const updatedRowData = [...attributeFramingRowData];
      updatedRowData[editingRowIndex] = {
        ...updatedRowData[editingRowIndex],
        objectId: selectedItem.term,
        description: selectedItem.description,
        predicateId: selectedItem.typeOfMatch,
        mappingJustification: selectedItem.mappingJustification
      };
      setAttributeFramingRowData(updatedRowData);
    }

    setShowEditModal(false);
    setEditingRowIndex(null);
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    setEditingRowIndex(null);
  };

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
          helpText: t("This is the name for the attribute and, for example...")
        }
      },
      {
        field: "predicateId",
        width: 150,
        autoHeight: true,
        editable: false,
        cellStyle: preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Predicate"),
          helpText: t("Mapping vocabulary ...")
        }
      },
      {
        field: "objectId",
        width: 150,
        autoHeight: true,
        editable: false,
        cellStyle: preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Object"),
          helpText: t("Ontology term")
        }
      },
      {
        field: "description",
        width: 400,
        autoHeight: true,
        editable: false,
        cellStyle: preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Description"),
          helpText: t("Definition")
        }
      },
      {
        field: "mappingJustification",
        width: 300,
        autoHeight: true,
        cellStyle: preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Framing Justification"),
          helpText: t("Framing Justification")
        }
      },
      {
        headerName: t("Edit"),
        field: "edit",
        width: 70,
        cellRendererFramework: EditButton,
        cellRendererParams: {
          onEdit: handleEdit
        },
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
    [t, handleEdit, handleDelete]
  );

  const unframedAttributesText = frameAllAttributes
    ? t("All attributes are framed")
    : hasUnframedAttributes
      ? `${t("Unframed attributes")}: [${unframedAttributeList.join(", ")}]`
      : t("No attributes to frame");

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
    if (!gridReady || !gridRef.current?.api) {
      logWarn("Grid not ready for save operation");
      return;
    }

    try {
      gridRef.current.api.stopEditing();
      const rowData = gridRef.current.api.getRenderedNodes()?.map((node) => node?.data);
      if (rowData) {
        setAttributeFramingRowData(rowData);
      }
    } catch (error) {
      logError("Error saving grid data:", error);
    }
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
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={handleDeleteCurrentOverlay}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      {showEditModal && (
        <EditAttributeFramingModal
          open={showEditModal}
          onClose={handleEditClose}
          onSave={handleEditSave}
          editingRowData={
            editingRowIndex !== null ? attributeFramingRowData[editingRowIndex] : null
          }
        />
      )}
      <Box sx={{ my: "2rem" }}>
        {isLoadingPredicates ? (
          <Spinner text="Framing Attributes..." size={36} />
        ) : (
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
                disabled={frameAllAttributes || !gridReady}
                onClick={handleFrameAllAttributes}
                sx={{
                  padding: "0.5rem 1rem",
                  minWidth: BUTTON_MIN_WIDTH,
                  ...((frameAllAttributes || !gridReady) && buttonDisabledStyles)
                }}
              >
                {!gridReady
                  ? t("Loading...")
                  : frameAllAttributes
                    ? t("All attributes are framed")
                    : t("Frame all attributes")}
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
                {unframedAttributesText}
              </Box>
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
                ref={gridRef}
                rowData={attributeFramingRowData}
                columnDefs={columnDefs}
                domLayout="autoHeight"
                stopEditingWhenCellsLoseFocus
                suppressHorizontalScroll={false}
                onGridReady={() => setGridReady(true)}
              />
            </Box>
          </Box>
        )}
      </Box>
    </BackNextSkeleton>
  );
};

export default AttributeFraming;
