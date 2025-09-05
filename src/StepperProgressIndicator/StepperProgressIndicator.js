import React from "react";
import { Box, Step, StepLabel, Stepper } from "@mui/material";
import { useContext } from "react";
import { Context } from "../App";
import { CustomPalette } from "../constants/customPalette";

export default function StepperProgressIndicator({ activeStep, steps }) {
  const { currentTheme } = useContext(Context);
  return (
    <Box sx={{ px: 10, py: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((step) => (
          <Step
            key={step.label}
            sx={{
              "& .MuiSvgIcon-root.Mui-active": {
                color: currentTheme?.primaryColor || CustomPalette.PRIMARY,
              },
              "& .MuiSvgIcon-root.Mui-completed": {
                color: currentTheme?.primaryColor || CustomPalette.PRIMARY,
              },
            }}
          >
            <StepLabel
              sx={{
                "& .MuiStepLabel-label": {
                  fontFamily: currentTheme?.typography?.fontFamily ?? "Roboto, sans-serif"
                }
              }}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
