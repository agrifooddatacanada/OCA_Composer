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

  const handleChange = (e) => {
    props.node.updateData({
      ...props.data,
      [columnHeader]: e.target.value
    });
    props.onRefresh();
    props.setRevalidateData(true);
    setIsDropdownOpen(false);
  };

  const handleClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const typesDisplay = listItems.map((value) => (
    <MenuItem
      key={value}
      value={value}
      sx={{ border: "none", height: "2rem", fontSize: "small" }}
    >
      <strong>{value}</strong>: {listItemObjectDisplay[value] || ""}
    </MenuItem>
  ));

  return listItems.length > 0 ? (
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
