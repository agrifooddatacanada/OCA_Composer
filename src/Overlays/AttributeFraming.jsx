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
import {
  matchedSubjectAndPredicate,
  searchPredicates,
  getLabelofParentClass
} from "../constants/utils";

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
    term: result.label || result.term || "",
    description: result.definition || result.description || "",
    typeOfMatch: ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.typeOfMatch[0]?.value,
    mappingJustification:
      ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS.mappingJustification[0]?.value,
    uri: result?.uri,
    subClassOf: result?.subClassOf || []
  }));

// Tree node component for ontology hierarchy
const TreeNode = ({
  node,
  level = 0,
  isParent = false,
  isChild = false,
  isSelected = false,
  expandedNodes,
  toggleNode
}) => {
  const { id, label, hasChildren } = node;
  const nodeId = id || "root";
  const isExpanded = expandedNodes.includes(nodeId);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          py: 0.3,
          px: 0.5,
          ml: level * 2,
          cursor: hasChildren ? "pointer" : "default",
          "&:hover": {
            backgroundColor: "#f5f5f5"
          },
          backgroundColor: isSelected ? CustomPalette.PINK_100 : "transparent",
          borderLeft: isSelected ? `3px solid ${CustomPalette.PRIMARY}` : "none",
          pl: isSelected ? 1 : 0.5
        }}
        onClick={hasChildren ? () => toggleNode(nodeId) : undefined}
      >
        {hasChildren ? (
          <Typography
            variant="body2"
            sx={{
              mr: 0.5,
              fontSize: "12px",
              color: "#666",
              fontFamily: "monospace",
              fontWeight: "bold"
            }}
          >
            {isExpanded ? "−" : "+"}
          </Typography>
        ) : (
          <Box sx={{ width: 8, mr: 0.5 }} />
        )}

        <Typography
          variant="body2"
          sx={{
            fontSize: "13px",
            fontWeight: isSelected ? "500" : "normal",
            color: isSelected ? CustomPalette.PRIMARY : "#333",
            flexGrow: 1
          }}
        >
          {label}
        </Typography>

        {isParent && (
          <Typography
            variant="caption"
            sx={{
              ml: 1,
              color: "#666",
              fontSize: "11px"
            }}
          >
            (parent)
          </Typography>
        )}
        {isChild && (
          <Typography
            variant="caption"
            sx={{
              ml: 1,
              color: "#666",
              fontSize: "11px"
            }}
          >
            (subclass)
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const CustomTreeView = ({ selectedTerm }) => {
  const [expandedNodes, setExpandedNodes] = useState(["root"]);
  const [hierarchyData, setHierarchyData] = useState({ parents: [], children: [] });
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) =>
      prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
    );
  };

  const fetchParentClassLabels = async (subClassOfArray) => {
    if (!subClassOfArray || subClassOfArray.length === 0) return [];

    setIsLoadingHierarchy(true);

    try {
      const promises = subClassOfArray.map(async (uri) => {
        try {
          const response = await getLabelofParentClass(uri);
          const { results } = response;
          return {
            id: results[0]?.uri,
            label: results[0]?.label,
            uri,
            hasChildren: false
          };
        } catch (error) {
          return {
            id: uri,
            label: uri,
            uri,
            hasChildren: false
          };
        }
      });

      const results = await Promise.all(promises);
      return results.filter(Boolean);
    } catch (error) {
      return [];
    } finally {
      setIsLoadingHierarchy(false);
    }
  };

  useEffect(() => {
    if (selectedTerm?.subClassOf && selectedTerm.subClassOf.length > 0) {
      fetchParentClassLabels(selectedTerm.subClassOf).then((parents) => {
        setHierarchyData({
          parents,
          children: [] // TODO: Implement children fetching if needed
        });
      });
    } else {
      setHierarchyData({ parents: [], children: [] });
    }
  }, [selectedTerm]);

  if (!selectedTerm) return null;
  return (
    <Box sx={{ maxHeight: "100%", overflow: "auto" }}>
      {/* Loading state */}
      {isLoadingHierarchy && (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                border: "2px solid #e0e0e0",
                borderTop: `2px solid ${CustomPalette.PRIMARY}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" }
                }
              }}
            />
            <Typography variant="body2" sx={{ color: "#666", fontSize: "13px" }}>
              Loading hierarchy...
            </Typography>
          </Box>
        </Box>
      )}

      {/* Parent classes with selected term as children */}
      {!isLoadingHierarchy && hierarchyData.parents.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="body2"
            sx={{
              color: "#666",
              fontWeight: "500",
              mb: 1,
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: 0.5
            }}
          >
            Ontology Hierarchy
          </Typography>
          {hierarchyData.parents.map((parent) => (
            <Box key={parent.id}>
              <TreeNode
                node={{ ...parent, hasChildren: true }}
                level={0}
                isParent
                expandedNodes={expandedNodes}
                toggleNode={toggleNode}
              />
              {/* Show selected term under expanded parent */}
              {expandedNodes.includes(parent.id) && (
                <TreeNode
                  node={{ id: "selected", label: selectedTerm.term, hasChildren: false }}
                  level={1}
                  isSelected
                  expandedNodes={expandedNodes}
                  toggleNode={toggleNode}
                />
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Child classes */}
      {hierarchyData.children.length > 0 && (
        <Box>
          <Typography
            variant="body2"
            sx={{
              color: "#666",
              fontWeight: "500",
              mb: 1,
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: 0.5
            }}
          >
            Subclasses
          </Typography>
          {hierarchyData.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={0}
              isChild
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
            />
          ))}
        </Box>
      )}

      {/* URI References */}
      {!isLoadingHierarchy && hierarchyData.parents.length > 0 && (
        <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #e0e0e0" }}>
          <Typography
            variant="body2"
            sx={{
              color: "#666",
              fontWeight: "500",
              mb: 1,
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: 0.5
            }}
          >
            uris
          </Typography>
          {hierarchyData.parents.map((parent) => (
            <Box key={`ref-${parent.id}`} sx={{ mb: 1, pl: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#888",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  wordBreak: "break-all"
                }}
              >
                {parent.label}: {parent.uri}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Empty state */}
      {!isLoadingHierarchy &&
        hierarchyData.parents.length === 0 &&
        hierarchyData.children.length === 0 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No hierarchy data available for this term
            </Typography>
          </Box>
        )}
    </Box>
  );
};

const EditAttributeFramingModal = ({ open, onClose, onSave, editingRowData }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedTermForExploring, setSelectedTermForExploring] = useState(null);
  const gridRef = useRef();

  useEffect(() => {
    if (editingRowData && editingRowData.Attribute) {
      setSearchTerm(editingRowData.Attribute);
      setSearchResults([]);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalResults(0);
    }
  }, [editingRowData]);

  const handleSearch = async (page = 1) => {
    if (!searchTerm.trim()) {
      return;
    }

    setIsSearching(true);

    try {
      const response = await searchPredicates({
        page,
        page_size: 17,
        query: searchTerm
      });

      const { results, count } = response;
      const resultsData = toDisplayRowData(results);
      const calculatedTotalPages = Math.ceil(count / 17);

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
    handleSearch(1);
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
        width: 130,
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
        width: 220,
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
                Frame: {editingRowData?.Attribute || "Search Terms"}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={10}>
                    <TextField
                      fullWidth
                      placeholder="Search for terms..."
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
              {selectedTermForExploring ? (
                <Box sx={{ height: "calc(70vh - 80px)", overflow: "auto" }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {selectedTermForExploring.term}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                    {selectedTermForExploring.description}
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      border: `1px solid ${CustomPalette.GREY_300}`,
                      borderRadius: 1,
                      backgroundColor: CustomPalette.PINK_100
                    }}
                  >
                    <CustomTreeView selectedTerm={selectedTermForExploring} />
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: "calc(70vh - 80px)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Box
                    sx={{
                      mb: 3,
                      fontFamily: "monospace",
                      fontSize: "14px",
                      color: "#bbb",
                      lineHeight: 1.2,
                      textAlign: "left"
                    }}
                  >
                    <div>├── Parent Class</div>
                    <div>│ └── Selected Term</div>
                    <div>│ ├── Subclass 1</div>
                    <div>│ └── Subclass 2</div>
                    <div>└── Another Parent</div>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#888",
                      textAlign: "center",
                      maxWidth: "80%"
                    }}
                  >
                    Select a term from the search results to explore its ontological
                    hierarchy
                  </Typography>
                </Box>
              )}
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

  const handleDelete = (rowIndex) => {
    const updatedRowData = attributeFramingRowData.filter(
      (_, index) => index !== rowIndex
    );

    setAttributeFramingRowData(updatedRowData);

    if (editingRowIndex !== null && editingRowIndex > rowIndex) {
      setEditingRowIndex(editingRowIndex - 1);
    }
  };

  const handleEditSave = (selectedItem) => {
    if (selectedItem && editingRowIndex !== null) {
      const updatedRowData = [...attributeFramingRowData];
      updatedRowData[editingRowIndex] = {
        ...updatedRowData[editingRowIndex],
        objectId: selectedItem.term,
        description: selectedItem.description,
        typeOfMatch: selectedItem.typeOfMatch,
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
        setIsLoadingPredicates(false);
        return;
      }

      setIsLoadingPredicates(true);
      const updatedRowData = [...attributeFramingRowData];

      const promises = updatedRowData.map(async (row, index) => {
        if (row.Attribute && !row.objectId) {
          try {
            const matchedResult = await matchedSubjectAndPredicate({
              page: 1,
              page_size: 1,
              query: row.Attribute
            });

            if (matchedResult) {
              updatedRowData[index] = {
                ...row,
                objectId: matchedResult.label || "",
                description: matchedResult.definition || ""
              };
            }
          } catch (error) {
            // No match found for subject - handled gracefully
          }
        }
      });

      await Promise.all(promises);
      setAttributeFramingRowData(updatedRowData);
      setPredicatesLoaded(true);
      setDataPopulated(true);
      setTimeout(() => {
        setIsLoadingPredicates(false);
      }, 500);
    };

    populateAttributeFraming();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <Box sx={{}}>
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
