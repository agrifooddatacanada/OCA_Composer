import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import i18next from "i18next";
import { useTranslation } from "react-i18next";
import { Typography, Tooltip, Button, Box, useMediaQuery } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import { CustomPalette } from "../constants/customPalette";
import logo from "../assets/agri-logo.png";
import logoWhite from "../assets/agri-logo-white.png";
import HeaderWrapper from "./HeaderWrapper";
import logoSE from "../assets/se-logo.png";

export default function Header({ currentPage }) {
  const { t } = useTranslation();
  const [header, setHeader] = useState(currentPage);
  const [toolTipText, setToolTipText] = useState("");
  const [helpLink, setHelpLink] = useState("");
  const location = useLocation();
  // Detecting mobile screens with 'isMobile'
  const isMobile = useMediaQuery("(max-width:736px)");
  const [selectedLanguage, setSelectedLanguage] = useState(
    i18next.language === "en-US" || i18next.language === "en-CA" ? "en" : i18next.language
  );

  useEffect(() => {
    setSelectedLanguage(i18next.language);
  }, []);

  const changeLanguage = (event) => {
    const lng = event.target.value;
    setSelectedLanguage(lng);
    i18next.changeLanguage(lng);
  };

  // Sets headers and tooltip Text based on current page
  useEffect(() => {
    switch (currentPage) {
      case "Start":
        setHeader(t("Start Creating an OCA Schema"));
        setToolTipText("");
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/CreatingOCASchema/`
        );
        break;
      case "Metadata":
        setHeader(t("Schema Metadata"));
        setToolTipText(t("This page is where you can write the metadata describing..."));
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/SchemaMetadata/`
        );
        break;
      case "Details":
        setHeader(t("Attribute Details"));
        setToolTipText(
          t("Each column of your dataset is an attribute in your schema...")
        );
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/AttributeDetails/`
        );
        break;
      case "Codes":
        setHeader(t("Add Entry Codes"));
        setToolTipText(t("Entry codes are options you want available to users as a..."));
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/AddEntryCode/`
        );
        break;
      case "LanguageDetails":
        setHeader(t("Language Dependent Attribute Details"));
        setToolTipText(t("You can add details in each language to help users..."));
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/LanguageAttribute/`
        );
        break;
      case "View":
        setHeader(t("Review Schema"));
        setToolTipText(
          t(
            "Before finishing your schema you can preview the final contents on this page"
          )
        );
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/ViewSchema/`
        );
        break;
      case "Overlays":
        setHeader(t("Add Additional Optional Information"));
        // TODO: Add help tooltips
        setToolTipText("");
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/Overlays/`
        );
        break;
      case "CharacterEncoding":
        setHeader(t("Add Character Encoding"));
        setToolTipText(
          t("Character encoding of the data source (for each attribute)...")
        );
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/CharacterEncoding/`
        );
        break;
      case "RequiredEntries":
        setHeader(t("Add Required Entries"));
        setToolTipText(
          t(
            "Specify if the underlying data must have an entry for the specific attribute"
          )
        );
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/RequiredEntry/`
        );
        break;
      case "FormatRules":
        setHeader(t("Add Format Rules for Data Entry"));
        setToolTipText("");
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/FormatText/`
        );
        break;
      case "Cardinality":
        setHeader(t("Add Entry Limit Rules for Data Entry"));
        setToolTipText("");
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/Cardinality/`
        );
        break;
      case "DataStandards":
        setHeader(t("Add Data Standards"));
        setToolTipText("");
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/DataStandards/`
        );
        break;
      case "StartDataValidator":
        setHeader(t("Upload Data (optional)"));
        setToolTipText("");
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_DEW_v_Help_Pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/DataEntryVerificationStart`
        );
        break;
      case "SchemaViewDataValidator":
        setHeader(t("Preview Schema"));
        setToolTipText("");
        setHelpLink("");
        break;
      case "DatasetViewDataValidator":
        setHeader(t("Preview Dataset"));
        setToolTipText("");
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_DEW_v_Help_Pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/PreviewSchema`
        );
        break;
      case "AttributeMatchDataValidator":
        setHeader(t("Matching Attributes"));
        setToolTipText("");
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_DEW_v_Help_Pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/MatchAttributes/`
        );
        break;
      case "OCADataValidatorCheck":
        setHeader(t("Data Entry and Verification"));
        setToolTipText("");
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_DEW_v_Help_Pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/DataVerification/`
        );
        break;
      case "UnitFraming":
        setHeader(t("Define units for schema attributes"));
        setToolTipText("");
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/UnitFraming/`
        );
        break;
      case "UserSelection":
        setHelpLink(
          `https://agrifooddatacanada.github.io/OCA_Composer_help_pages/${selectedLanguage === "en-US" || selectedLanguage === "en-CA" ? "en" : selectedLanguage}/Coauthor/`
        );
        break;
      case "Range":
        setHeader(t("Add Range Rules for Data"));
        setToolTipText("");
        setHelpLink("");
        break;
      default:
        setHeader("");
        setHelpLink("");
    }
  }, [currentPage, t]);

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
            <Link
              to="/"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/";
              }}
            >
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
              href="https://agrifooddatacanada.ca/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={logo}
                style={{
                  display: "block",
                  width: isMobile ? "100px" : "150px",
                  marginRight: "20px",
                  cursor: "pointer"
                }}
                alt="Agri-food Data Canada"
              />
            </a>
            <Typography
              sx={{
                fontSize: 25,
                fontWeight: "bold",
                color: CustomPalette.PRIMARY,
                alignSelf: "center"
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
            {/* <div>
              <select
                id="language-select"
                style={{
                  border: "none",
                  fontSize: "18px",
                  color: "white",
                  background: CustomPalette.PRIMARY,
                  marginRight: "2.5rem"
                }}
                value={schemaMode}
                onChange={(e) => setSchemaMode(e.target.value)}
              >
                <option value={SCHEMA_MODE_SINGLE}>Single schema</option>
                <option value={SCHEMA_MODE_MULTI_LEVEL}>Multi-level schema</option>
              </select>
            </div> */}

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
              href="https://agrifooddatacanada.ca/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={logoWhite}
                style={{
                  display: "block",
                  width: isMobile ? "auto" : "250px",
                  height: isMobile ? "70px" : "auto",
                  marginRight: isMobile ? "unset" : "20px",
                  cursor: "pointer"
                }}
                alt="Agri-food Data Canada"
              />
            </a>
          </Box>
        ) : (
          <>
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
                  color: CustomPalette.PRIMARY
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
