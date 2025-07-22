import React, { useContext, useMemo, useRef, useState, useEffect } from "react";
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
  FormControl
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
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import DeleteConfirmation from "./DeleteConfirmation";
import {
  FIELD_ATTRIBUTE_FRAMING_OVERLAY,
  ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS
} from "../constants/constants";
import { CustomPalette } from "../constants/customPalette";
import { matchedSubjectAndPredicate, searchPredicates } from "../constants/utils";

let globalGridRef = null;

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

// Dropdown cell renderers defined outside
const TypeOfMatchCellRenderer = ({ value, rowIndex }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(
    value || ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.typeOfMatch[0]?.value || ""
  );

  const handleChange = (e) => {
    const newValue = e.target.value;
    setSelectedValue(newValue);

    // Update the row data directly using AG Grid API
    if (globalGridRef && globalGridRef.current && globalGridRef.current.api) {
      const node = globalGridRef.current.api.getRowNode(rowIndex);
      if (node) {
        node.setDataValue("typeOfMatch", newValue);
      }
    }
    setIsDropdownOpen(false);
  };

  const handleClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    setSelectedValue(
      value || ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.typeOfMatch[0]?.value || ""
    );
  }, [value]);

  const getDisplayText = (value) => {
    const option = ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.typeOfMatch.find(
      (opt) => opt.value === value
    );
    const text = option ? option.label : value;
    return text.length > 25 ? `${text.substring(0, 25)}...` : text;
  };

  const getFullText = (value) => {
    const option = ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.typeOfMatch.find(
      (opt) => opt.value === value
    );
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
          onClick={handleClick}
          open={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          onOpen={() => setIsDropdownOpen(true)}
          renderValue={(value) => getDisplayText(value)}
        >
          {ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.typeOfMatch.map((option) => (
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

const MappingJustificationCellRenderer = ({ value, rowIndex }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(
    value || ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.mappingJustification[0]?.value || ""
  );

  const handleChange = (e) => {
    const newValue = e.target.value;
    setSelectedValue(newValue);

    // Update the row data directly using AG Grid API
    if (globalGridRef && globalGridRef.current && globalGridRef.current.api) {
      const node = globalGridRef.current.api.getRowNode(rowIndex);
      if (node) {
        node.setDataValue("mappingJustification", newValue);
      }
    }
    setIsDropdownOpen(false);
  };

  const handleClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    setSelectedValue(
      value || ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.mappingJustification[0]?.value || ""
    );
  }, [value]);

  const getDisplayText = (value) => {
    const option = ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.mappingJustification.find(
      (opt) => opt.value === value
    );
    const text = option ? option.label : value;
    return text.length > 30 ? `${text.substring(0, 30)}...` : text;
  };

  const getFullText = (value) => {
    const option = ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.mappingJustification.find(
      (opt) => opt.value === value
    );
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
          onClick={handleClick}
          open={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          onOpen={() => setIsDropdownOpen(true)}
          renderValue={(value) => getDisplayText(value)}
        >
          {ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.mappingJustification.map((option) => (
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

// Checkbox renderer component defined outside
const CheckboxRenderer = (props) => {
  const { value, rowIndex, colDef } = props;
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current.checked = value;
  }, [value]);

  const handleChange = (event) => {
    const { checked } = event.target;
    if (globalGridRef && globalGridRef.current && globalGridRef.current.api) {
      const node = globalGridRef.current.api.getRowNode(rowIndex);
      if (node) {
        // If checking this box, uncheck all others first
        if (checked) {
          const allNodes = globalGridRef.current.api.getRenderedNodes();
          allNodes.forEach((node, index) => {
            if (index !== rowIndex) {
              node.setDataValue(colDef.field, false);
            }
          });
        }

        node.setDataValue(colDef.field, checked);
      }
    }
  };

  return <input type="checkbox" ref={inputRef} onChange={handleChange} />;
};

const toDisplayRowData = (results) =>
  results.map((result) => ({
    term: result.label || result.term || "",
    description: result.definition || result.description || "",
    typeOfMatch: ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.typeOfMatch[0]?.value,
    mappingJustification:
      ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.mappingJustification[0]?.value
  }));

const EditAttributeFramingModal = ({ open, onClose, onSave, editingRowData }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const gridRef = useRef();

  // Set search term when modal opens with editing row data
  useEffect(() => {
    if (editingRowData && editingRowData.subjectId) {
      setSearchTerm(editingRowData.subjectId);
      // Clear previous search results when setting new search term
      setSearchResults([]);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalResults(0);
    }
  }, [editingRowData]);

  const handleSearch = async (page = 1) => {
    if (!searchTerm.trim()) {
      console.log("No search term provided");
      return;
    }

    console.log("Searching for:", searchTerm, "page:", page);
    setIsSearching(true);

    try {
      const response = await searchPredicates({
        page,
        page_size: 17,
        query: searchTerm
      });

      console.log("response", response);

      const { results, count } = response;
      const resultsData = toDisplayRowData(results);
      const calculatedTotalPages = Math.ceil(count / 17); // 17 is the page_size

      console.log("Setting search results:", resultsData.length, "items");
      setSearchResults(resultsData);
      setCurrentPage(page);
      setTotalPages(calculatedTotalPages);
      setTotalResults(count);
      globalGridRef = gridRef;
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchButtonClick = () => {
    console.log("Search button clicked");
    handleSearch(1); // Always start from page 1 when clicking search button
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
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
          gridRef: globalGridRef
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
          headerText: "Term",
          helpText: "The term name or label"
        }
      },
      {
        field: "description",
        headerName: "Description",
        width: 250,
        autoHeight: true,
        cellRenderer: DescriptionCellRenderer,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: "Description",
          helpText: "Detailed description of the term"
        }
      },
      {
        field: "typeOfMatch",
        headerName: "Type of Match",
        width: 150,
        autoHeight: true,
        cellStyle: preWrapWordBreak,
        cellRenderer: TypeOfMatchCellRenderer,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: "Type of Match",
          helpText: "Select the type of match for this term"
        }
      },
      {
        field: "mappingJustification",
        headerName: "Mapping Justification",
        width: 180,
        autoHeight: true,
        cellStyle: preWrapWordBreak,
        cellRenderer: MappingJustificationCellRenderer,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: "Mapping Justification",
          helpText: "Select the mapping justification for this term"
        }
      }
    ],
    []
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
          width: "90vw",
          maxWidth: 1400,
          maxHeight: "90vh",
          overflow: "auto",
          p: 3
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{ color: CustomPalette.PRIMARY, mb: 3 }}
        >
          Edit or Add terms
        </Typography>

        <Grid container spacing={3}>
          {/* Left Box - Search */}
          <Grid item xs={7}>
            <Paper
              sx={{
                p: 3,
                height: "70vh",
                border: `1px solid ${CustomPalette.GREY_300}`,
                boxShadow: "none"
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: CustomPalette.PRIMARY, mb: 2 }}
              >
                Frame: {editingRowData?.subjectId || "Search Terms"}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={10}>
                    <TextField
                      fullWidth
                      placeholder="Search terms"
                      value={searchTerm}
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
                  <Grid item xs={2}>
                    <Button
                      variant="contained"
                      onClick={handleSearchButtonClick}
                      disabled={isSearching}
                      startIcon={<SearchIcon />}
                      sx={{
                        height: "40px",
                        minWidth: "80px",
                        backgroundColor: CustomPalette.PRIMARY,
                        "&:hover": {
                          backgroundColor: CustomPalette.SECONDARY
                        },
                        "&:disabled": {
                          backgroundColor: CustomPalette.GREY_300
                        }
                      }}
                    >
                      {isSearching ? "..." : "Search"}
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
                    mt: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <Typography variant="body2" color="textSecondary" mt={4}>
                    Page {currentPage} of {totalPages} ({totalResults} total results)
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
                      Previous
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages}
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
                      Next
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Right Box - Explore Terms */}
          <Grid item xs={5}>
            <Paper
              sx={{
                p: 3,
                height: "70vh",
                border: `1px solid ${CustomPalette.GREY_300}`,
                boxShadow: "none"
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: CustomPalette.PRIMARY, mb: 2 }}
              >
                Explore Terms
              </Typography>
              <Box
                sx={{
                  height: "calc(70vh - 80px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `2px dashed ${CustomPalette.GREY_300}`,
                  borderRadius: 1,
                  backgroundColor: CustomPalette.PINK_200
                }}
              >
                <Typography variant="body1" color="textSecondary">
                  Term relationship explorer will be developed here
                </Typography>
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
            Cancel
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
            Save Changes
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [dataPopulated, setDataPopulated] = useState(false);

  const handleEdit = (rowIndex) => {
    setEditingRowIndex(rowIndex);
    setShowEditModal(true);
  };

  const handleEditSave = (selectedItem) => {
    // Handle saving the edited data
    console.log(
      "Saving edited data for row:",
      editingRowIndex,
      "with selected item:",
      selectedItem
    );

    // Update the main grid data with the selected item
    if (selectedItem && editingRowIndex !== null) {
      const updatedRowData = [...attributeFramingRowData];
      updatedRowData[editingRowIndex] = {
        ...updatedRowData[editingRowIndex],
        subjectId: selectedItem.term, // Term from search becomes subjectId
        objectId: selectedItem.term, // Term from search becomes objectId (predicate replacement)
        description: selectedItem.description, // Description from search
        typeOfMatch: selectedItem.typeOfMatch, // Type of match from dropdown
        mappingJustification: selectedItem.mappingJustification // Mapping justification from dropdown
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
        field: "subjectId",
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
          helpText: t("This is the name for the predicate and, for example...")
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
          helpText: t("This is the name for the object and, for example...")
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
          helpText: t("This is the name for the description and, for example...")
        }
      },
      {
        field: "mappingJustification",
        width: 300,
        autoHeight: true,
        cellStyle: preWrapWordBreak,
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
      // Skip if data is already populated or if there's no data
      if (
        dataPopulated ||
        !attributeFramingRowData ||
        attributeFramingRowData.length === 0
      ) {
        setPredicatesLoaded(true);
        setIsLoadingPredicates(false);
        return;
      }

      const hasObjects = attributeFramingRowData.some((row) => row.objectId);

      if (hasObjects) {
        setPredicatesLoaded(true);
        setDataPopulated(true);
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
      setDataPopulated(true);
      // Add a small delay to make the loading state visible
      setTimeout(() => {
        setIsLoadingPredicates(false);
      }, 500);
    };

    populateAttributeFraming();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed attributeFramingRowData from dependencies

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
