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
      helpText={t("Rather than allowing free text entry into a record, you may wish to limit entries to one of a few in a list. For example, you may wish to create a list of choices for gender, or for experimental farm name, or for species. You will then be able to create entries for your list that will be part of the schema.")}
      onCheckboxChange={handleCheckboxChange}
      inputRef={inputRef}
    />
  );
};

export default ListHeader;
