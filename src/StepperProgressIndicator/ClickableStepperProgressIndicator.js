import React from "react";
import { Alert, Box, ButtonBase, Step, StepLabel, Stepper } from "@mui/material";
import { alpha } from "@mui/material/styles";
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
                    sx={(theme) => ({
                      cursor: "pointer",
                      alignSelf: "center",
                      px: 2,
                      py: 0.5,
                      border: `1px solid ${CustomPalette.PRIMARY}`,
                      borderRadius: 1,
                      backgroundColor: "transparent",
                      color: CustomPalette.PRIMARY,
                      boxShadow: i === activeStep
                        ? "0 0 0 3px rgba(148, 0, 42, 0.35), 0 0 10px rgba(148, 0, 42, 0.25)"
                        : "none",
                      animation: i === activeStep ? "stepperPulse 2s infinite" : "none",
                      "@keyframes stepperPulse": {
                        "0%": { boxShadow: "0 0 0 2px rgba(148, 0, 42, 0.25), 0 0 6px rgba(148, 0, 42, 0.15)" },
                        "50%": { boxShadow: "0 0 0 5px rgba(148, 0, 42, 0.45), 0 0 14px rgba(148, 0, 42, 0.25)" },
                        "100%": { boxShadow: "0 0 0 2px rgba(148, 0, 42, 0.25), 0 0 6px rgba(148, 0, 42, 0.15)" }
                      },
                      fontSize: "0.875rem",
                      fontWeight: i === activeStep ? 700 : 500,
                      lineHeight: 1.2,
                      maxWidth: "140px",
                      minHeight: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      transition: "background-color 0.2s ease, box-shadow 0.2s ease, font-weight 0.2s ease",
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.button.main, theme.palette.action.hoverOpacity),
                        color: CustomPalette.PRIMARY,
                        transform: "none",
                        boxShadow: i === activeStep
                          ? "0 0 0 3px rgba(148, 0, 42, 0.35), 0 0 10px rgba(148, 0, 42, 0.25)"
                          : "none"
                      }
                    })}
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
