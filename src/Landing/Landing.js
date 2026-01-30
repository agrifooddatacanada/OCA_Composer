import { Box } from "@mui/material";
import React, { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { CustomPalette } from "../constants/customPalette";
import QuickStart from "./Quick_Start";
import Introduction from "./Introduction";
import AccordionList from "./AccordionList";
import { Context } from "../App";
import Footer from "../Footer/Footer";
import Header from "../Header/Header";
import GeneralAnnouncementBanner from "./AnnouncementBanner";

const Landing = () => {
  const path = useLocation();
  const { t } = useTranslation();
  const { setCurrentPage } = useContext(Context);

  useEffect(() => {
    if (path.pathname === "/") {
      setCurrentPage("Landing");
    }
  }, [path.pathname, setCurrentPage]);

  return (
    <>
      <GeneralAnnouncementBanner
        message={t(
          "Semantic Engine is currently undergoing maintenance and schemas cannot be exported at this time"
        )}
      />
      <Header currentPage="Landing" />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <Box
          sx={{
            backgroundColor: CustomPalette.PRIMARY,
            width: "100%",
            height: "100%",
            paddingTop: 10,
            paddingBottom: 12,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Introduction />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            backgroundColor: "#ffefea",
            width: "100%"
          }}
        >
          <QuickStart />
        </Box>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            marginTop: "30px"
          }}
        >
          <AccordionList />
        </Box>
      </Box>
      <Footer currentPage="Landing" />
    </>
  );
};

export default Landing;
