import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useMultiSchema } from "../schema/schemaContext";
import CheckboxColumnHeader from "./CheckboxColumnHeader";

const ListHeader = ({ gridRef }) => {
  const { t } = useTranslation();
  const inputRef = useRef();
  const { getSchema, updateSchema } = useMultiSchema();

  const handleCheckboxChange = (event) => {
    const { checked } = event.target;

    gridRef.current.api.forEachNode((node) => {
      node.setDataValue("List", checked);
    });

    const schemaState = getSchema() || {};
    const prevAttributes = Array.isArray(schemaState.attributes) ? schemaState.attributes : [];
    const prevEntryCodes = schemaState.entryCodes || {};

    const nextAttributes = prevAttributes.map(attr => ({ ...attr, List: checked }));
    const nextLists = checked ? prevAttributes.map(attr => attr.Attribute).filter(Boolean) : [];
    const nextEntryCodes = checked ? { ...prevEntryCodes } : {};

    if (checked) {
      nextLists.forEach(attrName => {
        if (!Array.isArray(nextEntryCodes[attrName])) {
          nextEntryCodes[attrName] = [];
        }
      });
    }

    updateSchema({
      attributes: nextAttributes,
      attributesWithLists: nextLists,
      entryCodes: nextEntryCodes
    });
  };

  useEffect(() => {
    inputRef.current.checked = false;
  }, []);

  return (
    <CheckboxColumnHeader
      label={t("List")}
      helpText={t("Rather than allow free text entry into a record, you may...")}
      onCheckboxChange={handleCheckboxChange}
      inputRef={inputRef}
    />
  );
};

export default ListHeader;
