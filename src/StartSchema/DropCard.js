import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, Typography, Alert, Tooltip, Box, Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import LoopIcon from "@mui/icons-material/Loop";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { CustomPalette } from "../constants/customPalette";
import {
  defaultNoteDescription,
  defaultTooltip,
  defaultUploadedDescription
} from "../constants/constants";
import { Context } from "../App";
import usePrimaryColor from "../hooks/usePrimaryColor";
import useFontFamily from "../hooks/useFontFamily";

export default function DropCard({
  loading,
  dropDisabled,
  dropMessage,
  spinningAnimation,
  downloadIconColor,
  getRootProps,
  getInputProps,
  hover,
  handleHover,
  handleHoverLeave,
  handleDragOver,
  handleDragLeave,
  description = defaultUploadedDescription,
  tipDescription = defaultTooltip,
  noteDescription = defaultNoteDescription
}) {
  const { t } = useTranslation();
  const { currentTheme } = useContext(Context);
  const primaryColor = usePrimaryColor();
  const fontFamily = useFontFamily();
  return (
    <section
      className="container"
      style={{ height: "16rem", marginTop: "3rem", marginBottom: "1rem" }}
    >
      <div {...getRootProps({ className: "dropzone" })}>
        <input {...getInputProps()} />
        <Box>
          {tipDescription && (
            <Box
              sx={{
                textAlign: "right",
                height: "0rem",
                transform: "translateX(25px)",
                color: CustomPalette.GREY_600
              }}
            >
              <Tooltip
                title={<div style={{ whiteSpace: "pre-line" }}>{t(tipDescription)}</div>}
                arrow
                placement="right"
              >
                <HelpOutlineIcon sx={{ fontSize: 15 }} />
              </Tooltip>
            </Box>
          )}
          <Card
            sx={{
              maxWidth: 575,
              margin: "auto",
              border: "1px dashed grey",
              transition: "all 0.2s ease-in-out",
              boxShadow: hover === true && dropDisabled === false ? 9 : 0,
              height: "15rem"
            }}
            onMouseOver={handleHover}
            onMouseLeave={handleHoverLeave}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {dropMessage?.message?.length > 0 && (
              <Alert
                severity={dropMessage?.type}
                style={{
                  position: "absolute",
                  zIndex: 9999,
                  left: "50%",
                  transform: "translate(-50%, -110%)"
                }}
              >
                {dropMessage?.message}
              </Alert>
            )}

            <CardContent sx={{ pr: 10, pl: 10, pt: 2, pb: 1 }}>
              <Box
                sx={{
                  height: "100%",
                  minHeight: "11rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {dropDisabled === false && loading === false && (
                    <Button
                      variant="contained"
                      color="button"
                      sx={{
                        width: 250,
                        mt: 1,
                        mb: 1,
                        textTransform: "none",
                        whiteSpace: "pre-line",
                        textAlign: "center",
                        lineHeight: 1.2
                      }}
                    >
                      {t(description)}
                    </Button>
                  )}

                  {loading === true ? (
                    <LoopIcon
                      sx={{
                        color: CustomPalette.GREY_300,
                        my: 1,
                        fontSize: "60px",
                        animation: spinningAnimation,
                        transition: "all 0.2s ease-in-out"
                      }}
                    />
                  ) : dropDisabled === true ? (
                    <CheckCircleOutlineIcon
                      sx={{
                        my: 1,
                        fontSize: "60px",
                        color: CustomPalette.PRIMARY
                      }}
                    />
                  ) : (
                    <DownloadIcon
                      sx={{
                        color: downloadIconColor,
                        my: 1,
                        fontSize: "60px",
                        transition: "all 0.2s ease-in-out"
                      }}
                    />
                  )}
                </Box>

                <Typography
                  sx={{
                    fontSize: 12,
                    color: CustomPalette.GREY_600,
                    fontFamily,
                    textAlign: "center",
                    pb: 0
                  }}
                >
                  {t(noteDescription)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </div>
    </section>
  );
}
