import { MenuItem } from "@mui/material";
import React, { memo, useState } from "react";
import { DropdownMenuList } from "../components/DropdownMenuCell";

const EntryCodeDropdownSelector = memo((props) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const columnHeader = props.colDef.field;
  const listItemObjectDisplay = props.dataHeaders?.[columnHeader].reduce((acc, item) => {
    acc[item.Code] = item[props.lang];
    return acc;
  }, {});
  const listItems = Object.keys(listItemObjectDisplay);
  const currentValue = props.node?.data?.[columnHeader];

  const handleChange = (e) => {
    props.node.updateData({
      ...props.data,
      [columnHeader]: e.target.value
    });
    props.onRefresh();
    props.setRevalidateData(true);
    setIsDropdownOpen(false);
  };

  // If the current cell value is not one of the known codes, expose it as an
  // additional (temporary) option so MUI Select doesn't complain about an
  // out-of-range value. We don't normalize it here — validator will still flag
  // it as an invalid entry-code value.
  const effectiveListItems = listItems.slice();
  if (currentValue && !effectiveListItems.includes(currentValue)) {
    effectiveListItems.unshift(currentValue);
  }

  const handleClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const typesDisplay = effectiveListItems.map((value) => (
    <MenuItem
      key={value}
      value={value}
      sx={{ border: "none", height: "2rem", fontSize: "small" }}
    >
      {listItemObjectDisplay[value] ? (
        <><strong>{value}</strong>: {listItemObjectDisplay[value] || ""}</>
      ) : (
        // currentValue fallback — show as unrecognized label
        <em style={{ color: "#666" }}>{String(value)}</em>
      )}
    </MenuItem>
  ));

  return effectiveListItems.length > 0 ? (
    <DropdownMenuList
      handleKeyDown={() => {}}
      type={props.node.data?.[columnHeader]}
      handleChange={handleChange}
      handleClick={handleClick}
      isDropdownOpen={isDropdownOpen}
      setIsDropdownOpen={setIsDropdownOpen}
      typesDisplay={typesDisplay}
    />
  ) : null;
});

export default EntryCodeDropdownSelector;
