import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useMultiSchema } from "../schema/schemaContext";
import CheckboxColumnHeader from "./CheckboxColumnHeader";
import { isChildSchemaType } from "../constants/constants";

const ListHeader = ({ gridRef }) => {
  const { t } = useTranslation();
  const inputRef = useRef();
  const { getSchema, updateSchema } = useMultiSchema();

  const handleCheckboxChange = (event) => {
    const { checked } = event.target;

    gridRef.current.api.forEachNode((node) => {
      const type = node?.data?.Type;
      node.setDataValue("List", isChildSchemaType(type) ? false : checked);
    });

    const schemaState = getSchema() || {};
    const prevAttributes = Array.isArray(schemaState.attributes) ? schemaState.attributes : [];
    const prevEntryCodes = schemaState.entryCodes || {};

    const nextAttributes = prevAttributes.map((attr) => {
      const type = attr?.Type;
      return { ...attr, List: isChildSchemaType(type) ? false : checked };
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
