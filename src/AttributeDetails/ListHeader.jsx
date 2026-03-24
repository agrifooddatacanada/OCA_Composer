import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useMultiSchema } from "../schema/schemaContext";
import CheckboxColumnHeader from "./CheckboxColumnHeader";
import { TYPE_CHILD_SCHEMA, TYPE_PLACEHOLDER_CHILD_SCHEMA } from "../constants/constants";

const ListHeader = ({ gridRef }) => {
  const { t } = useTranslation();
  const inputRef = useRef();
  const { getSchema, updateSchema } = useMultiSchema();

  const handleCheckboxChange = (event) => {
    const { checked } = event.target;

    gridRef.current.api.forEachNode((node) => {
      const type = node?.data?.Type;
      const isChildSchemaType =
        type === TYPE_CHILD_SCHEMA ||
        type === TYPE_PLACEHOLDER_CHILD_SCHEMA ||
        (typeof type === "string" && (type.startsWith("refs:") || type.startsWith("refn:")));
      node.setDataValue("List", isChildSchemaType ? false : checked);
    });

    const schemaState = getSchema() || {};
    const prevAttributes = Array.isArray(schemaState.attributes) ? schemaState.attributes : [];
    const prevEntryCodes = schemaState.entryCodes || {};

    const nextAttributes = prevAttributes.map((attr) => {
      const type = attr?.Type;
      const isChildSchemaType =
        type === TYPE_CHILD_SCHEMA ||
        type === TYPE_PLACEHOLDER_CHILD_SCHEMA ||
        (typeof type === "string" && (type.startsWith("refs:") || type.startsWith("refn:")));
      return { ...attr, List: isChildSchemaType ? false : checked };
    });

    const nextLists = checked
      ? nextAttributes.filter((a) => a?.List === true).map((a) => a.Attribute).filter(Boolean)
      : [];

    const nextEntryCodes = checked
      ? nextLists.reduce((acc, attrName) => {
          acc[attrName] = Array.isArray(prevEntryCodes[attrName]) ? prevEntryCodes[attrName] : [];
          return acc;
        }, {})
      : {};

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
