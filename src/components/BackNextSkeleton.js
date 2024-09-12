import { Alert, Box, Button } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { CustomPalette } from "../constants/customPalette";
import { useTranslation } from "react-i18next";

const BackNextSkeleton = ({ errorMessage = '', isBack = false, pageBack, isForward = false, pageForward, children, backText = 'Back', middleText, nextText = 'Next' }) => {
  const { t } = useTranslation();
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
          marginTop: 2,
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {isBack ? <Button
            color="navButton"
            sx={{ textAlign: "left", alignSelf: "flex-start" }}
            onClick={pageBack}
          >
            <ArrowBackIosIcon /> {t(backText)}
          </Button> : <Box />}
          {middleText && <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: CustomPalette.GREY_200,

              marginLeft: "2rem",
              marginRight: "2rem",
              paddingLeft: "1rem",
              paddingRight: "1rem",
            }}
          >
            <p>{middleText}</p>
          </Box>}
          <Box>
            {isForward && <Button
              color="navButton"
              onClick={pageForward}
              sx={{ color: CustomPalette.PRIMARY }}
            >
              {t(nextText)} <ArrowForwardIosIcon />
            </Button>}
            {errorMessage.length > 0 && (
              <Alert
                severity="error"
                style={{
                  position: "absolute",
                  zIndex: 9999,
                  right: "20%",
                  transform: "translateY(-90%)",
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