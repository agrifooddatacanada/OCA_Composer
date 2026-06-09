import { Typography } from "@mui/material";
import React from "react";
import Spinner from "./Spinner";

const fullscreenStyle = {
  position: "fixed",
  top: "70px",
  left: 0,
  width: "100%",
  height: "calc(100% - 70px)",
  background: "rgba(255,255,255,0.9)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1200
};

const containedStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: "100%",
  height: "100%",
  background: "rgba(255,255,255,0.9)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 10
};

const Loading = ({ text, spinner, contained = false }) => {
  const loadingContainerStyle = contained ? containedStyle : fullscreenStyle;

  const textStyle = {
    fontSize: "1.5rem",
    marginTop: "1.5rem"
  };

  return (
    <div style={loadingContainerStyle}>
      {spinner ? (
        <Spinner text={text || "Loading..."} size={40} />
      ) : (
        <Typography style={textStyle}>{text || "Loading..."}</Typography>
      )}
    </div>
  );
};

export default Loading;
