import React, { useState, useEffect, useCallback } from "react";
import { Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";

// A custom headerComponent replaces AG Grid's own click-to-sort header entirely
// (AG Grid doesn't layer that behavior on top automatically), so it has to be
// re-implemented here for every grid using this component to get sorting.
// A neutral "unfold" icon marks sortable columns before they've been sorted,
// so sortability is discoverable rather than something to stumble into.
// Inert (no cursor, no click handler, no icon at all) on columns that aren't
// sortable, so this is a no-op everywhere sortable isn't explicitly set.
const CellHeader = ({ headerText, constraint, helpText, column, enableSorting, progressSort }) => {
  const [sortDirection, setSortDirection] = useState(() => column?.getSort?.() ?? null);

  useEffect(() => {
    if (!column || !enableSorting) return undefined;
    const onSortChanged = () => setSortDirection(column.getSort());
    column.addEventListener("sortChanged", onSortChanged);
    return () => column.removeEventListener("sortChanged", onSortChanged);
  }, [column, enableSorting]);

  const handleClick = useCallback(
    (event) => {
      if (!enableSorting) return;
      progressSort(event.shiftKey);
    },
    [enableSorting, progressSort]
  );

  return (
    <>
      <span
        onClick={handleClick}
        style={{
          margin: "auto",
          textOverflow: "ellipsis",
          overflow: "hidden",
          cursor: enableSorting ? "pointer" : "default"
        }}
      >
        {headerText}{" "}
        {constraint && <span style={{ fontSize: "10px" }}>({constraint})</span>}
        {enableSorting && (
          <span style={{ display: "inline-flex", alignItems: "center", verticalAlign: "middle" }}>
            {sortDirection === "asc" && (
              <ArrowUpwardIcon sx={{ fontSize: 14, marginLeft: "4px" }} />
            )}
            {sortDirection === "desc" && (
              <ArrowDownwardIcon sx={{ fontSize: 14, marginLeft: "4px" }} />
            )}
            {!sortDirection && (
              <UnfoldMoreIcon sx={{ fontSize: 14, marginLeft: "4px", color: "rgba(0, 0, 0, 0.3)" }} />
            )}
          </span>
        )}
      </span>
      {helpText && (
        <Tooltip title={helpText} placement="top" arrow>
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            <HelpOutlineIcon sx={{ fontSize: 15, marginLeft: "8px" }} />
          </span>
        </Tooltip>
      )}
    </>
  );
};

export default CellHeader;
