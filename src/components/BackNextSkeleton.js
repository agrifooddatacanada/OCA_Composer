import { Alert, Box, Button } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { CustomPalette } from "../constants/customPalette";

const BackNextSkeleton = ({ errorMessage = '', isBack = false, pageBack, isForward = false, pageForward, children }) => {
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
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {isBack && <Button
            color="navButton"
            sx={{ textAlign: "left", alignSelf: "flex-start" }}
            onClick={pageBack}
          >
            <ArrowBackIosIcon /> Back
          </Button>}
          <Box sx={{ alignSelf: "flex-end" }}>
            {isForward && <Button
              color="navButton"
              onClick={pageForward}
              sx={{ color: CustomPalette.PRIMARY }}
            >
              Next <ArrowForwardIosIcon />
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