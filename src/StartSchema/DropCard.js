import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Alert,
  Tooltip,
  Box
} from "@mui/material";
import { CustomPalette } from "../constants/customPalette";
import DownloadIcon from "@mui/icons-material/Download";
import LoopIcon from "@mui/icons-material/Loop";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { defaultTooltip, defaultUploadedDescription } from "../constants/constants";

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
  tipDescription = defaultTooltip
}) {
  return (
    <section
      className="container"
      style={{ height: "16rem", marginTop: "3rem", marginBottom: "1rem" }}
    >
      <div {...getRootProps({ className: "dropzone" })}>
        <input {...getInputProps()} />
        <Box>
          <Box
            sx={{
              textAlign: "right",
              height: "0rem",
              transform: "translateX(25px)",
              color: CustomPalette.GREY_600,
            }}
          >
            <Tooltip
              title={tipDescription}
              arrow
              placement="right"
            >
              <HelpOutlineIcon sx={{ fontSize: 15 }} />
            </Tooltip>
          </Box>
          <Card
            sx={{
              maxWidth: 575,
              margin: "auto",
              border: "1px dashed grey",
              transition: "all 0.2s ease-in-out",
              boxShadow: hover === true && dropDisabled === false ? 9 : 0,
              height: "15rem",
            }}
            onMouseOver={handleHover}
            onMouseLeave={handleHoverLeave}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {dropMessage?.message.length > 0 && (
              <Alert
                severity={dropMessage?.type}
                style={{
                  position: "absolute",
                  zIndex: 9999,
                  left: "50%",
                  transform: "translate(-50%, -110%)",
                }}
              >
                {dropMessage?.message}
              </Alert>
            )}

            <CardContent sx={{ pr: 10, pl: 10 }}>
              {loading === true ? (
                <LoopIcon
                  sx={{
                    color: CustomPalette.GREY_300,
                    m: 2,
                    fontSize: "60px",
                    animation: spinningAnimation,
                    transition: "all 0.2s ease-in-out",
                  }}
                />
              ) : dropDisabled === true ? (
                <CheckCircleOutlineIcon
                  sx={{
                    m: 2,
                    fontSize: "60px",
                    // color: CustomPalette.GREEN_400,
                    color: CustomPalette.PRIMARY,
                  }}
                />
              ) : (
                <DownloadIcon
                  sx={{
                    color: downloadIconColor,
                    m: 2,
                    fontSize: "60px",
                    transition: "all 0.2s ease-in-out",
                    transform:
                      hover === true && dropDisabled === false && "translateY(5px)",
                  }}
                />
              )}
              <Typography
                sx={{
                  fontSize: 14,
                  mb: 2,
                  color:
                    dropDisabled === false
                      ? CustomPalette.PRIMARY
                      : CustomPalette.GREY_600,
                  whiteSpace: "pre-line",
                }}
                gutterBottom
              >
                {dropDisabled === false ? (
                  description
                ) : (
                  <>
                    Use the buttons below to add a <strong>new</strong> file or{" "}
                    <strong>edit</strong> the uploaded file.
                  </>
                )}
              </Typography>
              <Typography sx={{ fontSize: 12, color: CustomPalette.GREY_600 }}>
                Note: None of this data will be uploaded to a server and all
                processing happens on device.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </div>
    </section>
  );
}
