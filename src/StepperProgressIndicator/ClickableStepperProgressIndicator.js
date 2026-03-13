import React from "react";
import { Alert, Box, ButtonBase, Step, StepLabel, Stepper } from "@mui/material";
import { useTranslation } from "react-i18next";
import CustomPalette from "../constants/customPalette";

export default function ClickableStepperProgressIndicator({
  activeStep,
  steps,
  onStepClick,
  stepErrors = {}
}) {
  const { t } = useTranslation();
  return (
    <Box sx={{ px: 10, py: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((step, i) => (
          <Step
            key={step.label}
            sx={{
              "& .MuiSvgIcon-root.Mui-active": { color: CustomPalette.PRIMARY },
              "& .MuiSvgIcon-root.Mui-completed": { color: CustomPalette.PRIMARY },
              "& .MuiStepLabel-root": { alignItems: "center" },
              "& .MuiStepLabel-labelContainer": { display: "flex", justifyContent: "center" }
            }}
          >
            <StepLabel>
              <Box sx={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <ButtonBase
                component="span"
                onClick={() => onStepClick && onStepClick(i, step)}
                sx={{
                  cursor: "pointer",
                  alignSelf: "center",
                  px: 2,
                  py: 0.5,
                  border: `1px solid ${CustomPalette.PRIMARY}`,
                  borderRadius: 1,
                  backgroundColor: i === activeStep ? CustomPalette.PRIMARY : "transparent",
                  color: i === activeStep ? "white" : CustomPalette.PRIMARY,
                  boxShadow: "none",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  lineHeight: 1.2,
                  maxWidth: "140px",
                  minHeight: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    backgroundColor: i === activeStep ? CustomPalette.PRIMARY : CustomPalette.WHITE,
                    color: i === activeStep ? "white" : CustomPalette.PRIMARY,
                    boxShadow: i === activeStep ? "none" : "0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)",
                    transform: i === activeStep ? "none" : "translateY(-1px)"
                  }
                }}
              >
                {t(step.label)}
              </ButtonBase>
              {stepErrors[step.label] && (
                <Alert
                  severity="error"
                  sx={{
                    position: "absolute",
                    top: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    mt: 1,
                    width: 180,
                    zIndex: 9999,
                    boxShadow: 2
                  }}
                >
                  {stepErrors[step.label]}
                </Alert>
              )}
              </Box>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
