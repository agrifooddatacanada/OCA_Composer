import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
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
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr) auto",
            alignItems: "start",
            columnGap: 2,
            position: "relative",
            bgcolor: "background.default"
          }}
        >
          <Box sx={{ justifySelf: "start" }}>
            {isBack ? (
              <Button
                color="navButton"
                sx={{
                  textAlign: "left",
                  color: primaryColor,
                  fontFamily
                }}
                onClick={pageBack}
              >
                <ArrowBackIosIcon /> {t(backText)}
              </Button>
            ) : null}
          </Box>
          <Box
            sx={{
              justifySelf: "stretch",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minWidth: 0,
              px: 1
            }}
          >
            {middleText ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: CustomPalette.GREY_200,
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                  py: 0.5,
                  maxWidth: "100%",
                  boxSizing: "border-box"
                }}
              >
                <Box
                  component="p"
                  sx={{
                    m: 0,
                    textAlign: "center",
                    fontFamily,
                    overflowWrap: "break-word"
                  }}
                >
                  {middleText}
                </Box>
              </Box>
            ) : null}
          </Box>
          <Box
            sx={{
              position: "relative",
              justifySelf: "end",
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
              flexShrink: 0
            }}
          >
            {isForward && (
              <Button
                color="navButton"
                onClick={pageForward}
                disabled={disableForward}
                sx={{
                  color: primaryColor,
                  fontFamily,
                  flexShrink: 0
                }}
              >
                {t(nextText)} <ArrowForwardIosIcon />
              </Button>
            )}
            {rightContent}
          </Box>
        </Box>
        {errorMessage.length > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              mt: 1,
              mb: 1
            }}
          >
            <Alert
              severity="error"
              sx={{
                width: "fit-content",
                maxWidth: "min(100%, 42rem)",
                boxSizing: "border-box"
              }}
            >
              {errorMessage}
            </Alert>
          </Box>
        )}
        {children}
      </Box>
    </Box>
  );
};

export default BackNextSkeleton;
