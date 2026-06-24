import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MenuItem, Modal, Box } from "@mui/material";
import { DropdownMenuList } from "../components/DropdownMenuCell";
import { useMultiSchema } from "../schema/schemaContext";
import {
  TYPE_CHILD_SCHEMA,
  TYPE_PLACEHOLDER_CHILD_SCHEMA,
  isChildSchemaType,
  isUnitEligibleAttributeType
} from "../constants/constants";
import { resolveChildSchemaStateRootId } from "../schema/childSchemaSubtree";
import DeleteConfirmation from "../Overlays/DeleteConfirmation";
import { removeAttributeFromMap } from "../utils/stringUtils";

const TypeRenderer = ({ data, attributeRowData, typesObjectRef, dropRefs, setAttributeRowData }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showChildSchemaDeleteModal, setShowChildSchemaDeleteModal] = useState(false);
  const [pendingTypeChange, setPendingTypeChange] = useState(null);
  const skipSyncRef = useRef(false);
  const { t } = useTranslation();
  const { getSchema, updateSchema, createChildSchemaPlaceholder, removeChildSchemaSubtree } =
    useMultiSchema();

  const displayValues = [
    { value: "", label: "" },
    { value: "Numeric", label: "Numeric" },
    { value: "Text", label: "Text" },
    { value: "DateTime", label: "DateTime" },
    { value: "Boolean", label: "Boolean" },
    { value: "Binary", label: "Binaryfile" },
    { value: TYPE_CHILD_SCHEMA, label: TYPE_CHILD_SCHEMA },
    { value: "Array[Numeric]", label: "Array[Numeric]" },
    { value: "Array[Text]", label: "Array[Text]" },
    { value: "Array[DateTime]", label: "Array[DateTime]" },
    { value: "Array[Boolean]", label: "Array[Boolean]" },
    { value: "Array[Binary]", label: "Array[Binaryfile]" }
  ];

  const attributeName = data.Attribute;
  const currentAttribute = attributeRowData.find((item) => item.Attribute === attributeName);
  const index = attributeRowData.findIndex((item) => item.Attribute === attributeName);

  const getInitialType = () => {
    if (!currentAttribute) return "";
    const rawType = currentAttribute.Type;
    if (rawType === TYPE_PLACEHOLDER_CHILD_SCHEMA) return TYPE_CHILD_SCHEMA;
    return rawType !== undefined && rawType !== null ? rawType : "";
  };
  const [type, setType] = useState(getInitialType());

  const typesDisplay = displayValues.map((value) => (
    <MenuItem
      key={value.value}
      value={value.value}
      sx={{ border: "none", height: "2rem", fontSize: "small" }}
    >
      {value.label !== "" ? t(value.label) : value.label}
    </MenuItem>
  ));

  const rowType = () => {
    const row = attributeRowData.find((item) => item.Attribute === attributeName);
    return row?.Type ?? data?.Type;
  };

  const applyTypeChange = (newType) => {
    skipSyncRef.current = true;
    setType(newType);

    const newTypesObject = { ...typesObjectRef.current };
    newTypesObject[attributeName] = newType;
    typesObjectRef.current = newTypesObject;

    const updatedAttributeRowData = attributeRowData.map((item) => {
      if (item.Attribute === attributeName) {
        const next = {
          ...item,
          Type: newType,
          ...(newType === TYPE_CHILD_SCHEMA ? { List: false, EntryCodes: [] } : {}),
          ...(isUnitEligibleAttributeType(newType) ? {} : { Unit: "" })
        };
        if (!isChildSchemaType(newType)) {
          delete next.OriginalType;
        }
        return next;
      }
      return item;
    });
    setAttributeRowData(updatedAttributeRowData);

    const schemaState = getSchema() || {};
    const prevType = (attributeRowData.find((item) => item.Attribute === attributeName))?.Type ?? data?.Type;
    const typeChanged = prevType !== newType;

    const schemaUpdate = { attributes: updatedAttributeRowData };
    if (typeChanged) {
      schemaUpdate.attributeFormats = removeAttributeFromMap(schemaState.attributeFormats, attributeName);
    }

    if (newType === TYPE_CHILD_SCHEMA) {
      const prevLists = Array.isArray(schemaState.attributesWithLists)
        ? schemaState.attributesWithLists
        : [];
      const prevEntryCodes = schemaState.entryCodes || {};

      schemaUpdate.attributesWithLists = prevLists.filter((a) => a !== attributeName);
      schemaUpdate.entryCodes = { ...prevEntryCodes };
      delete schemaUpdate.entryCodes[attributeName];
    }

    updateSchema(schemaUpdate);

    if (newType === TYPE_CHILD_SCHEMA) {
      createChildSchemaPlaceholder(attributeName);
    }

    setIsDropdownOpen(false);
  };

  const handleChange = (e) => {
    const newType = e.target.value;
    const prevTypeRaw = rowType();
    if (isChildSchemaType(prevTypeRaw) && newType !== TYPE_CHILD_SCHEMA) {
      setPendingTypeChange(newType);
      setShowChildSchemaDeleteModal(true);
      setIsDropdownOpen(false);
      return;
    }
    applyTypeChange(newType);
  };

  const confirmRemoveChildSchemaType = () => {
    if (pendingTypeChange === null) return;
    const row = attributeRowData.find((a) => a.Attribute === attributeName);
    const rootId = resolveChildSchemaStateRootId(row);
    if (rootId) removeChildSchemaSubtree(rootId);
    setShowChildSchemaDeleteModal(false);
    const next = pendingTypeChange;
    setPendingTypeChange(null);
    applyTypeChange(next);
  };

  const closeChildSchemaDeleteModal = () => {
    setShowChildSchemaDeleteModal(false);
    setPendingTypeChange(null);
  };

  const handleClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    const currentAttr = attributeRowData.find((i) => i.Attribute === attributeName);

    if (currentAttr) {
      let displayType = currentAttr.Type;
      if (displayType === undefined || displayType === null) {
        displayType = "";
      }
      if (displayType === TYPE_PLACEHOLDER_CHILD_SCHEMA) {
        displayType = TYPE_CHILD_SCHEMA;
      }
      setType(displayType);
      return;
    }

    const fromRef = typesObjectRef.current[attributeName];
    setType(fromRef !== undefined && fromRef !== null ? fromRef : "");
  }, [attributeName, attributeRowData]);

  const handleKeyDown = (e) => {
    const keyPressed = e.key;
    if (keyPressed === "Delete" || keyPressed === "Backspace") {
      if (isChildSchemaType(rowType())) {
        e.preventDefault();
        setPendingTypeChange("");
        setShowChildSchemaDeleteModal(true);
        return;
      }
      skipSyncRef.current = true;
      setType("");
      typesObjectRef.current[attributeName] = "";

      const updatedAttributeRowData = attributeRowData.map((item) => {
        if (item.Attribute === attributeName) {
          const next = { ...item, Type: "" };
          delete next.OriginalType;
          return next;
        }
        return item;
      });
      setAttributeRowData(updatedAttributeRowData);

      updateSchema({
        attributes: updatedAttributeRowData,
        attributeFormats: removeAttributeFromMap((getSchema() || {}).attributeFormats, attributeName)
      });
    }
  };

  const msg = t(
    "Removing this Child Schema type deletes this nested schema and all of its data, including any nested child schemas. This cannot be undone."
  );

  return (
    <>
      <Modal
        disableScrollLock
        open={showChildSchemaDeleteModal}
        onClose={closeChildSchemaDeleteModal}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            outline: "none"
          }}
        >
          <DeleteConfirmation
            variant="contained"
            confirmationMessage={msg}
            removeFromSelected={confirmRemoveChildSchemaType}
            closeModal={closeChildSchemaDeleteModal}
          />
        </Box>
      </Modal>
      <DropdownMenuList
        handleKeyDown={handleKeyDown}
        type={type}
        renderDisplayValue={(value) =>
          value ? t(value, { defaultValue: value }) : "\u200B"
        }
        handleChange={handleChange}
        dropRefs={dropRefs.current[index]}
        handleClick={handleClick}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        typesDisplay={typesDisplay}
      />
    </>
  );
};

export default TypeRenderer;
