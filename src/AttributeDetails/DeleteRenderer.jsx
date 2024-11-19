import React from "react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { CustomPalette } from "../constants/customPalette";

const DeleteRenderer = ({
  data,
  gridRef,
  typesObjectRef,
  setAttributesList,
  setAttributeRowData,
  canDelete,
  setCanDelete
}) => {
  const handleDeleteClick = () => {
    gridRef.current.api.stopEditing();
    const newAttributeRowData = JSON.parse(JSON.stringify(gridRef.current.props.rowData));
    newAttributeRowData.forEach((item) => {
      item.Type = typesObjectRef.current[item.Attribute] || "";
    });
    const allAttributes = [];
    gridRef.current.props.rowData.forEach((row) => allAttributes.push(row.Attribute));
    const index = allAttributes.indexOf(data.Attribute);
    if (index > -1) {
      allAttributes.splice(index, 1);
      setAttributesList(allAttributes);
      setAttributeRowData([...newAttributeRowData]);
    }
    if (allAttributes.length <= 1) {
      setCanDelete(false);
    }
  };
  return (
    canDelete && (
      <DeleteOutlineIcon
        sx={{
          pr: 1,
          color: CustomPalette.GREY_600,
          transition: "all 0.2s ease-in-out"
        }}
        onClick={handleDeleteClick}
      />
    )
  );
};

export default DeleteRenderer;
