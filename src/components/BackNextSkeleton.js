import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Context } from "../App";
import { CustomPalette } from "../constants/customPalette";
import usePrimaryColor from "../hooks/usePrimaryColor";
import useFontFamily from "../hooks/useFontFamily";

const BackNextSkeleton = ({
  errorMessage = "",
  isBack = false,
  pageBack,
  isForward = false,
  pageForward,
  children,
  backText = "Back",
  middleText,
  nextText = "Next",
  disableForward = false,
  rightContent
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useContext(Context);
  const primaryColor = usePrimaryColor();
  const fontFamily = useFontFamily();
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "auto",
          pr: 10,
          pl: 10,
          marginTop: 2
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 1250,
            bgcolor: "background.default"
          }}
        >
          {isBack ? (
            <Button
              color="navButton"
              sx={{
                textAlign: "left",
                alignSelf: "flex-start",
                color: primaryColor,
                fontFamily
              }}
              onClick={pageBack}
            >
              <ArrowBackIosIcon /> {t(backText)}
            </Button>
          ) : (
            <Box />
          )}
          {middleText && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: CustomPalette.GREY_200,

                marginLeft: "2rem",
                marginRight: "2rem",
                paddingLeft: "1rem",
                paddingRight: "1rem"
              }}
            >
              <p>{middleText}</p>
            </Box>
          )}
          <Box
            sx={{
              position: "relative",
              display: "flex",
              gap: 2,
              alignItems: "center",
              flex: 1,
              justifyContent: "flex-end",
              flexWrap: "wrap",
              minWidth: 0
            }}
          >
            {isForward && (
              <Button
                color="navButton"
                onClick={pageForward}
                disabled={disableForward}
                sx={{
                  color: primaryColor,
                  fontFamily
                }}
              >
                {t(nextText)} <ArrowForwardIosIcon />
              </Button>
            )}
            {rightContent}
            {errorMessage.length > 0 && (
              <Alert
                severity="error"
                style={{
                  position: "absolute",
                  zIndex: 9999,
                  right: "20%",
                  transform: "translateY(-90%)"
                }}
              >
                {errorMessage}
              </Alert>
            )}
          </Box>
        </Box>
        {children}
      </Box>
    </Box>
  );
};

export default BackNextSkeleton;
