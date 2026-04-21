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
            {t("If the attribute could be considered Personally Identifiable Information (PII) you can flag the attribute here. This will be documented in the schema and downstream users of your schema will understand they need to take care of the data that has been flagged.")}
          </div>
          <br />
          <div>{t("Examples of PII include names, locations, postal codes, telephone numbers, identifying genetic data, race, gender, ethnicity, etc.")}</div>
        </>
      }
      onCheckboxChange={handleCheckboxChange}
      inputRef={inputRef}
    />
  );
};

export default FlaggedHeader;
