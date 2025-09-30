import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Step, StepLabel, Stepper } from "@mui/material";
import { CustomPalette } from "../constants/customPalette";

export default function StepperProgressIndicator({ activeStep, steps }) {
  const { t } = useTranslation();
  return (
    <Box sx={{ px: 10, py: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((step) => (
          <Step
            key={step.label}
            sx={{
              "& .MuiSvgIcon-root.Mui-active": {
                color: CustomPalette.PRIMARY
              },
              "& .MuiSvgIcon-root.Mui-completed": {
                color: CustomPalette.PRIMARY
              }
            }}
          >
            <StepLabel>{t(step.label)}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
