import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getNormalizedUICode, getUICode, setUICode } from "../utils/languageUtils";
import { Typography, Tooltip, Button, Box, useMediaQuery } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

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
    Start: { header: t("Start Creating an OCA Schema"), toolTipText: "", helpLink: `${base}/${lang}/CreatingOCASchema/` },
    Metadata: { header: t("Schema Metadata"), toolTipText: t("This page is where you can write the metadata describing..."), helpLink: `${base}/${lang}/SchemaMetadata/` },
    Details: { header: t("Attribute Details"), toolTipText: t("Each column of your dataset is an attribute in your schema..."), helpLink: `${base}/${lang}/AttributeDetails/` },
    Codes: { header: t("Add Entry Codes"), toolTipText: t("Entry codes are options you want available to users as a..."), helpLink: `${base}/${lang}/AddEntryCode/` },
    LanguageDetails: { header: t("Language Dependent Attribute Details"), toolTipText: t("You can add details in each language to help users..."), helpLink: `${base}/${lang}/LanguageAttribute/` },
    View: { header: t("Review Schema"), toolTipText: t("Before finishing your schema you can preview the final contents on this page"), helpLink: `${base}/${lang}/ViewSchema/` },
    Overlays: { header: t("Add Additional Optional Information"), toolTipText: "", helpLink: `${base}/${lang}/Overlays/` },
    CharacterEncoding: { header: t("Add Character Encoding"), toolTipText: t("Character encoding of the data source (for each attribute)..."), helpLink: `${base}/${lang}/CharacterEncoding/` },
    RequiredEntries: { header: t("Add Required Entries"), toolTipText: t("Specify if the underlying data must have an entry for the specific attribute"), helpLink: `${base}/${lang}/RequiredEntry/` },
    FormatRules: { header: t("Add Format Rules for Data Entry"), toolTipText: "", helpLink: `${base}/${lang}/FormatText/` },
    FormInformation: { header: t("Add Form Information"), toolTipText: "", helpLink: `${base}/${lang}/FormInformation/` },
    FormBuilder: { header: t("Form Builder"), toolTipText: t("Create interactive forms using drag-and-drop interface"), helpLink: `${base}/${lang}/FormBuilder/` },
    Cardinality: { header: t("Add Entry Limit Rules for Data Entry"), toolTipText: "", helpLink: `${base}/${lang}/Cardinality/` },
    DataStandards: { header: t("Add Data Standards"), toolTipText: "", helpLink: `${base}/${lang}/DataStandards/` },
    StartDataValidator: { header: t("Upload Data (optional)"), toolTipText: "", helpLink: `${dewBase}/${lang}/DataEntryVerificationStart` },
    SchemaViewDataValidator: { header: t("Preview Schema"), toolTipText: "", helpLink: "" },
    DatasetViewDataValidator: { header: t("Preview Dataset"), toolTipText: "", helpLink: `${dewBase}/${lang}/PreviewSchema` },
    AttributeMatchDataValidator: { header: t("Matching Attributes"), toolTipText: "", helpLink: `${dewBase}/${lang}/MatchAttributes/` },
    OCADataValidatorCheck: { header: t("Data Entry and Verification"), toolTipText: "", helpLink: `${dewBase}/${lang}/DataVerification/` },
    UnitFraming: { header: t("Define units for schema attributes"), toolTipText: "", helpLink: `${base}/${lang}/UnitFraming/` },
    UserSelection: { header: "", toolTipText: "", helpLink: `${base}/${lang}/Coauthor/` },
    Range: { header: t("Add Range Rules for Data"), toolTipText: "", helpLink: `${base}/${lang}/Range/` }
  };
  return switchMap[currentPage] || { header: "", toolTipText: "", helpLink: "" };
}

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

  const { header, toolTipText, helpLink } = useMemo(
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
            <Typography
              sx={{
                fontSize: 25,
                fontWeight: "bold",
                color: primaryColor,
                alignSelf: "center",
                fontFamily
              }}
            >
              {header}
            </Typography>
            {toolTipText.length > 0 && (
              <Box sx={{ marginLeft: 2, color: CustomPalette.GREY_600 }}>
                <Tooltip
                  title={toolTipText}
                  placement={
                    header === "Attribute Details" || header === "View Schema"
                      ? "right"
                      : "right-start"
                  }
                  arrow
                >
                  <HelpOutlineIcon sx={{ fontSize: 15 }} />
                </Tooltip>
              </Box>
            )}
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
                {t("Help with this page")}
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
