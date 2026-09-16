import React, { useState } from "react";
import { Box, Modal } from "@mui/material";
import { useTranslation } from "react-i18next";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { CustomPalette } from "../constants/customPalette";
import { useMultiSchema } from "../schema/schemaContext";
import { isChildSchemaType } from "../constants/constants";
import { resolveChildSchemaStateRootId } from "../schema/childSchemaSubtree";
import DeleteConfirmation from "../Overlays/DeleteConfirmation";

const DeleteRenderer = ({
  data,
  gridRef,
  typesObjectRef,
  setAttributeRowData,
  canDelete,
  setCanDelete,
  currentRows
}) => {
  const { t } = useTranslation();
  const { getSchema, updateSchema, removeChildSchemaSubtree } = useMultiSchema();
  const [showChildSchemaDeleteModal, setShowChildSchemaDeleteModal] = useState(false);

  const rowForAttr = () =>
    (currentRows || []).find((r) => r.Attribute === data.Attribute) || data;

  const executeDeleteRow = () => {
    gridRef.current.api.stopEditing();

    const currentRowData = currentRows || [];
    const newAttributeRowData = JSON.parse(JSON.stringify(currentRowData));

    newAttributeRowData.forEach((item) => {
      item.Type = typesObjectRef.current[item.Attribute] || "";
    });

    const allAttributes = newAttributeRowData.map((row) => row.Attribute);
    const index = allAttributes.indexOf(data.Attribute);

    if (index > -1) {
      newAttributeRowData.splice(index, 1);

      setAttributeRowData(newAttributeRowData);

      setCanDelete(newAttributeRowData.length > 0);

      const schemaState = getSchema() || {};
      const nextEntryCodes = { ...(schemaState.entryCodes || {}) };
      delete nextEntryCodes[data.Attribute];

      const prevLists = schemaState.attributesWithLists || [];
      const nextLists = prevLists.filter((a) => a !== data.Attribute);

      const prevLanData = schemaState.lanAttributeRowData || {};
      const nextLanData = {};
      Object.keys(prevLanData).forEach((language) => {
        nextLanData[language] = prevLanData[language].filter(
          (item) => item.Attribute !== data.Attribute
        );
      });

      const nextFormatRuleData = (schemaState.formatRuleData || []).filter(
        (rule) => rule.Attribute !== data.Attribute
      );
      const nextRangeData = (schemaState.rangeData || []).filter(
        (range) => range.Attribute !== data.Attribute
      );
      const nextCardinalityData = (schemaState.cardinalityData || []).filter(
        (card) => card.Attribute !== data.Attribute
      );
      const nextDataStandardsData = (schemaState.dataStandardsData || []).filter(
        (std) => std.Attribute !== data.Attribute
      );
      const nextUnitFramedData = (schemaState.unitFramedData || []).filter(
        (unit) => unit.Attribute !== data.Attribute
      );
      const nextAttributeFramingSources = (schemaState.attributeFramingSources || []).map(
        (source) => ({
          ...source,
          rows: (source.rows || []).filter((framing) => framing.Attribute !== data.Attribute)
        })
      );

      const nextCharacterEncodingData = { ...(schemaState.characterEncodingData || {}) };
      delete nextCharacterEncodingData[data.Attribute];

      updateSchema({
        attributes: newAttributeRowData,
        entryCodes: nextEntryCodes,
        attributesWithLists: nextLists,
        lanAttributeRowData: nextLanData,
        formatRuleData: nextFormatRuleData,
        rangeData: nextRangeData,
        cardinalityData: nextCardinalityData,
        dataStandardsData: nextDataStandardsData,
        unitFramedData: nextUnitFramedData,
        attributeFramingSources: nextAttributeFramingSources,
        characterEncodingData: nextCharacterEncodingData
      });
    }
  };

  const handleDeleteClick = () => {
    const row = rowForAttr();
    const ty = typesObjectRef.current[data.Attribute] ?? row.Type;
    if (isChildSchemaType(ty)) {
      setShowChildSchemaDeleteModal(true);
      return;
    }
    executeDeleteRow();
  };

  const confirmDeleteChildSchemaRow = () => {
    const row = rowForAttr();
    const attr = { ...row, Type: typesObjectRef.current[data.Attribute] ?? row.Type };
    const rootId = resolveChildSchemaStateRootId(attr);
    if (rootId) removeChildSchemaSubtree(rootId);
    setShowChildSchemaDeleteModal(false);
    executeDeleteRow();
  };

  const closeModal = () => setShowChildSchemaDeleteModal(false);

  const msg = t(
    "Removing this Child Schema type deletes this nested schema and all of its data, including any nested child schemas. This cannot be undone."
  );

  if (!canDelete) return null;
  return (
    <>
      <Modal
        disableScrollLock
        open={showChildSchemaDeleteModal}
        onClose={closeModal}
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
            removeFromSelected={confirmDeleteChildSchemaRow}
            closeModal={closeModal}
          />
        </Box>
      </Modal>
      <Box
        className="delete-icon-wrapper"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%"
        }}
      >
        <DeleteOutlineIcon sx={{ color: CustomPalette.GREY_600 }} className="delete-icon-outline" />
        <DeleteForeverIcon
          onClick={handleDeleteClick}
          sx={{ color: CustomPalette.PRIMARY, cursor: "pointer" }}
          className="delete-icon-solid"
          title="Delete attribute"
        />
      </Box>
    </>
  );
};

export default DeleteRenderer;
