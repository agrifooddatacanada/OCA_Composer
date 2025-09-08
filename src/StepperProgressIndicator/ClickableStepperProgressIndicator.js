import React from "react";
import { Box, Step, StepLabel, Stepper } from "@mui/material";
import CustomPalette from "../constants/customPalette";

export default function ClickableStepperProgressIndicator({
  activeStep,
  steps,
  onStepClick
}) {
  return (
    <Box sx={{ px: 10, py: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((step, i) => (
          <Step
            key={step.label}
            sx={{
              "& .MuiSvgIcon-root.Mui-active": { color: CustomPalette.PRIMARY },
              "& .MuiSvgIcon-root.Mui-completed": { color: CustomPalette.PRIMARY }
            }}
          >
            <StepLabel>
              <Box
                component="span"
                onClick={() => onStepClick && onStepClick(i, step)}
                sx={{
                  cursor: "pointer",
                  px: 2,
                  py: 0.5,
                  border: `1px solid ${CustomPalette.PRIMARY}`,
                  borderRadius: 1,
                  backgroundColor: CustomPalette.PRIMARY,
                  color: "white",
                  boxShadow: "none",
                  fontSize: "0.875rem",
                  transition: "background-color 0.15s ease, transform 0.1s ease",
                  "&:hover": {
                    backgroundColor: CustomPalette.SECONDARY,
                    color: "white",
                    transform: "translateY(-1px)"
                  }
                }}
              >
                {step.label}
              </Box>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
