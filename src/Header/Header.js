import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getNormalizedUICode, getUICode, setUICode } from "../utils/languageUtils";
import { Typography, Button, Box, useMediaQuery } from "@mui/material";

import { CustomPalette } from "../constants/customPalette";
// import logo from "../assets/agri-logo.png";
// import logoWhite from "../assets/agri-logo-white.png";
import HeaderWrapper from "./HeaderWrapper";
import logoSE from "../assets/se-logo.png";
import { themes } from "../constants/themeConstants";
import { Context } from "../App";
import usePrimaryColor from "../hooks/usePrimaryColor";
import useFontFamily from "../hooks/useFontFamily";

function getHeaderMeta(currentPage, t, selectedLanguage) {
  const lang = selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage;
  const base = "https://agrifooddatacanada.github.io/OCA_Composer_help_pages";
  const dewBase = "https://agrifooddatacanada.github.io/OCA_DEW_v_Help_Pages";
  const switchMap = {
    Start: { header: t("Start Creating an OCA Schema"), toolTipText: t("Write column names or drag and drop an existing dataset (Excel or .csv file) to import names (the first row must contain the column headers). You can edit these later."), helpLink: `${base}/${lang}/CreatingOCASchema/` },
    Create: { header: t("Names"), toolTipText: t("Enter the column names below. These are the column headers in the tabular data set no matter the language."), helpLink: `${base}/${lang}/CreatingOCASchema/` },
    Metadata: { header: t("Schema Metadata"), toolTipText: t("Describe your schema using metadata to help others find, understand, and use your schema."), helpLink: `${base}/${lang}/SchemaMetadata/` },
    Details: { header: t("Attribute Details"), toolTipText: t("Each column of your dataset is an attribute in your schema. Here you can add, remove, and edit attributes and their details."), helpLink: `${base}/${lang}/AttributeDetails/` },
    Codes: { header: t("Add Entry Codes"), toolTipText: t("Entry codes are options you want available to users as a..."), helpLink: `${base}/${lang}/AddEntryCode/` },
    UploadEntryCodes: { header: t("Upload Entry Codes"), toolTipText: t("Upload a new file containing your entry codes and optionally edit them, or select an existing attribute to copy its entry codes from."), helpLink: `${base}/${lang}/AddEntryCode/` },
    PicklistEntryCodes: {
      header: t("Choose from existing entry codes. These can still be edited later."),
      toolTipText: t("Choose from existing entry codes. These can still be edited later."),
      helpLink: `${base}/${lang}/AddEntryCode/`
    },
    MatchingEntryCodes: {
      header: t("Check and edit (if needed) how imported column names are being assigned."),
      toolTipText: t("Check and edit (if needed) how imported column names are being assigned."),
      helpLink: `${base}/${lang}/AddEntryCode/`
    },
    MatchingJSONEntryCodes: {
      header: t("Check and edit (if needed) how imported column names are being assigned."),
      toolTipText: t("Check and edit (if needed) how imported column names are being assigned."),
      helpLink: `${base}/${lang}/AddEntryCode/`
    },
    MatchingPicklistEntryCodes: {
      header: t("Check and edit (if needed) how imported column names are being assigned."),
      toolTipText: t("Check and edit (if needed) how imported column names are being assigned."),
      helpLink: `${base}/${lang}/AddEntryCode/`
    },
    LanguageDetails: { header: t("Language Dependent Attribute Details"), toolTipText: t("You can add labels and descriptions in each language to help users of your schema. By having languages separate from the underlying structure it means you can share your schema in multiple languages."), helpLink: `${base}/${lang}/LanguageAttribute/` },
    View: { header: t("Review Schema"), toolTipText: t("Before finishing your schema you can preview the final contents on this page"), helpLink: `${base}/${lang}/ViewSchema/` },
    Overlays: { header: t("Add Additional Optional Information"), toolTipText: t("A variety of additional information can be added to your schema using overlays."), helpLink: `${base}/${lang}/Overlays/` },
    CharacterEncoding: { header: t("Add Character Encoding"), toolTipText: t("You can use the default encodings below if you don't know the encodings the data source uses. For new data, utf-8 is a good choice."), helpLink: `${base}/${lang}/CharacterEncoding/` },
    RequiredEntries: { header: t("Add Required Entries"), toolTipText: t("Specify if attributes must have data."), helpLink: `${base}/${lang}/RequiredEntry/` },
    FormatRules: {
      header: t("Add Format Rules for Data Entry"),
      toolTipText: t("Specify the format of values for Text, Numeric, DateTime, and Binary attributes."),
      helpLink: `${base}/${lang}/FormatText/`
    },
    FormInformation: {
      header: t("Placeholder Editor"),
      toolTipText: t(
        "Here you can start to define a form of questions. Start by editing placeholder answers for each question. Then hit NEXT to define pages, sections, and more."
      ),
      helpLink: `${base}/${lang}/FormInformation/`
    },
    FormBuilder: { header: t("Layout Builder"), toolTipText: t("Drag attributes from the left into pages or sections. Each attribute can be used once."), helpLink: `${base}/${lang}/FormBuilder/` },
    Cardinality: { header: t("Add Entry Limit Rules for Data Entry"), toolTipText: t("Define how many values your Array[] datatype attributes can have."), helpLink: `${base}/${lang}/Cardinality/` },
    DataStandards: { header: t("Add Data Standards"), toolTipText: "", helpLink: `${base}/${lang}/DataStandards/` },
    StartDataValidator: { header: t("Upload Data (optional)"), toolTipText: "", helpLink: `${dewBase}/${lang}/DataEntryVerificationStart` },
    SchemaViewDataValidator: { header: t("Preview Schema"), toolTipText: "", helpLink: "" },
    DatasetViewDataValidator: { header: t("Preview Dataset"), toolTipText: "", helpLink: `${dewBase}/${lang}/PreviewSchema` },
    AttributeMatchDataValidator: { header: t("Matching Attributes"), toolTipText: "", helpLink: `${dewBase}/${lang}/MatchAttributes/` },
    OCADataValidatorCheck: { header: t("Data Entry and Verification"), toolTipText: "", helpLink: `${dewBase}/${lang}/DataVerification/` },
    UnitFraming: {
      header: t("Define units for schema attributes"),
      toolTipText: t("Link units to terms drawn from an ontology or controlled vocabulary."),
      helpLink: `${base}/${lang}/UnitFraming/`
    },
    AttributeFraming: { header: t("Add Attribute Framing"), toolTipText: t("Link attributes to terms drawn from an ontology or controlled vocabulary."), helpLink: `${base}/${lang}/AttributeFraming/` },
    UserSelection: { header: "", toolTipText: "", helpLink: `${base}/${lang}/Coauthor/` },
    Range: { header: t("Add Range Rules for Data"), toolTipText: t("Add min. and/or max. values (inclusive or exclusive) for attributes with either Numeric or DateTime datatypes."), helpLink: `${base}/${lang}/Range/` }
  };
  return switchMap[currentPage] || { header: "", toolTipText: "", helpLink: "" };
}

export { getHeaderMeta };
export default function Header({ currentPage }) {
  const { t } = useTranslation();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width:736px)");
  const [selectedLanguage, setSelectedLanguage] = useState(
    getNormalizedUICode(getUICode())
  );
  const { currentTheme } = useContext(Context);
  const primaryColor = usePrimaryColor();
  const fontFamily = useFontFamily();
  useEffect(() => {
    setSelectedLanguage(getNormalizedUICode(getUICode()));
  }, []);

  const changeLanguage = (event) => {
    const lng = event.target.value;
    setSelectedLanguage(lng);
    setUICode(lng);
  };

  const { helpLink, toolTipText } = useMemo(
    () => getHeaderMeta(currentPage, t, selectedLanguage),
    [currentPage, t, selectedLanguage]
  );

  return (
    <HeaderWrapper
      isMobile={isMobile}
      headerColor={
        (currentPage === "Landing" || currentPage === "StartOCAMerge") &&
        CustomPalette.PRIMARY
      }
      centerItem={
        currentPage !== "Landing" &&
        currentPage !== "StartOCAMerge" &&
        toolTipText ? (
          <Typography
            sx={{
              color: CustomPalette.GREY_600,
              fontSize: "0.875rem",
              maxWidth: "min(100%, 1100px)",
              width: "100%",
              minWidth: 0,
              textAlign: "center",
              wordBreak: "break-word",
              pointerEvents: "none"
            }}
          >
            {toolTipText}
          </Typography>
        ) : null
      }
      leftItem={
        currentPage === "Landing" || currentPage === "StartOCAMerge" ? (
          <Box sx={{ flex: "column" }}>
            <Link to="/" style={{ textDecoration: "none" }}>
              <Typography
                sx={{
                  fontSize: isMobile ? 18 : 40,
                  fontWeight: "bold",
                  color: "white",
                  alignSelf: "start",
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                Semantic Engine
              </Typography>
              <Typography
                sx={{
                  fontSize: isMobile ? 14 : 22,
                  fontWeight: "semibold",
                  color: "white",
                  alignSelf: "start",
                  textAlign: "left",
                  cursor: "pointer",
                  marginTop: "-10px"
                }}
              >
                {t("Schemas")}
              </Typography>
            </Link>
          </Box>
        ) : (
          <>
            <Link to="/">
              <img src={logoSE} alt="Semantic Engine" style={{ maxWidth: "100px" }} />
            </Link>
            <div
              style={{
                width: "1px",
                height: "40px",
                backgroundColor: "#a3a3a3",
                margin: "0 10px"
              }}
            />
            <a
              // href="https://agrifooddatacanada.ca/"
              href={currentTheme.logos.primaryLogo.website}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={currentTheme.logos.primaryLogo.url}
                style={{
                  display: "block",
                  width: isMobile ? "100px" : "150px",
                  marginRight: "20px",
                  cursor: "pointer"
                }}
                alt={currentTheme.logos.primaryLogo.alt}
              />
            </a>
          </>
        )
      }
      rightItem={
        currentPage === "Landing" ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <div>
              <select
                id="language-select"
                style={{
                  border: "none",
                  fontSize: "25px",
                  color: "white",
                  background: CustomPalette.PRIMARY,
                  marginRight: "2.5rem"
                }}
                value={selectedLanguage}
                onChange={changeLanguage}
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
              </select>
            </div>
            <a
              href={themes.default.logos.homeNavLogo.website}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={themes.default.logos.homeNavLogo.url}
                style={{
                  display: "block",
                  width: isMobile ? "auto" : "250px",
                  height: isMobile ? "70px" : "auto",
                  marginRight: isMobile ? "unset" : "20px",
                  cursor: "pointer"
                }}
                alt={themes.default.logos.homeNavLogo.alt}
              />
            </a>
          </Box>
        ) : (
          <>
            {/* DEW page header */}
            {!location.pathname.includes("_help") && helpLink !== "" && (
              <Button
                color="button"
                variant="contained"
                target="_blank"
                sx={{
                  my: 2,
                  mr: 2,
                  py: 1,
                  px: 5
                }}
                onClick={() =>
                  window.open(`${helpLink}`, "_blank", "rel=noopener noreferrer")
                }
              >
                {t("Page Help")}
              </Button>
            )}
            <div>
              <select
                id="language-select"
                style={{
                  border: "none",
                  fontSize: "20px",
                  color: primaryColor,
                  fontFamily
                }}
                value={selectedLanguage}
                onChange={changeLanguage}
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
              </select>
            </div>
          </>
        )
      }
    />
  );
}
