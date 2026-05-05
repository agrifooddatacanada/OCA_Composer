import { Typography } from "@mui/material";
import React from "react";
import Spinner from "./Spinner";

const Loading = ({ text, spinner }) => {
  const loadingContainerStyle = {
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
