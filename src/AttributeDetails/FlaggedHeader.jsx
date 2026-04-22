import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import CheckboxColumnHeader from "./CheckboxColumnHeader";

const FlaggedHeader = ({ gridRef }) => {
  const { t } = useTranslation();
  const inputRef = useRef();

  const handleCheckboxChange = (event) => {
    const { checked } = event.target;
    gridRef.current.api.forEachNode((node) => {
      node.setDataValue("Sensitive", checked);
    });
  };

  useEffect(() => {
    inputRef.current.checked = false;
  }, []);

  return (
    <CheckboxColumnHeader
      label={t("Sensitive")}
      helpText={
        <>
          <div>
            {t("If the attribute could be considered Personally Identifiable...")}
          </div>
          <br />
          <div>{t("Examples of PII include names, locations, postal codes...")}</div>
        </>
      }
      onCheckboxChange={handleCheckboxChange}
      inputRef={inputRef}
    />
  );
};

export default FlaggedHeader;
