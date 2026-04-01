import React from "react";
import { Alert, Box, ButtonBase, Step, StepLabel, Stepper } from "@mui/material";
import { useTranslation } from "react-i18next";
import CustomPalette from "../constants/customPalette";

function ClickableStepperProgressIndicator({
  activeStep,
  steps,
  onStepClick,
  stepErrors = {}
}) {
  const { t } = useTranslation();
  const hasStepErrors = steps.some((s) => stepErrors[s.label]);
  return (
    <Box
      sx={(theme) => ({
        px: 10,
        py: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        zIndex: theme.zIndex.drawer + 55,
        isolation: "isolate",
        bgcolor: "background.default",
        overflow: "visible"
      })}
    >
      <Box sx={{ position: "relative", width: "100%", overflow: "visible" }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ width: "100%", overflow: "visible" }}>
          {steps.map((step, i) => (
            <Step
              key={step.label}
              sx={{
                overflow: "visible",
                "& .MuiSvgIcon-root.Mui-active": { color: CustomPalette.PRIMARY },
                "& .MuiSvgIcon-root.Mui-completed": { color: CustomPalette.PRIMARY },
                "& .MuiStepLabel-root": { alignItems: "center", overflow: "visible" },
                "& .MuiStepLabel-labelContainer": { display: "flex", justifyContent: "center", overflow: "visible" }
              }}
            >
              <StepLabel>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <ButtonBase
                    component="span"
                    disableRipple
                    focusRipple={false}
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
                </Box>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        {hasStepErrors && (
          <Box
            sx={(theme) => ({
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              mt: 1,
              zIndex: theme.zIndex.snackbar,
              display: "grid",
              gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
              width: "100%",
              gap: 1,
              alignItems: "start",
              pointerEvents: "none"
            })}
          >
            {steps.map((step) => (
              <Box key={step.label} sx={{ display: "flex", justifyContent: "center", px: 0.5 }}>
                {stepErrors[step.label] ? (
                  <Alert
                    severity="error"
                    sx={{
                      width: "100%",
                      maxWidth: 220,
                      boxShadow: 2,
                      textAlign: "left",
                      pointerEvents: "auto"
                    }}
                  >
                    {stepErrors[step.label]}
                  </Alert>
                ) : null}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default React.memo(ClickableStepperProgressIndicator);
