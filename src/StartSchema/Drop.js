import React, { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import DropCard from "./DropCard";
import { messages } from "../constants/messages";
import { CustomPalette } from "../constants/customPalette";
import LandingDropZone from "../Landing/LandingDropZone";

export default function Drop({
  setFile,
  setLoading,
  loading,
  dropDisabled,
  dropMessage,
  setDropMessage,
  version
}) {
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/vnd.ms-excel": [".csv", ".xls", ".xlsx"],
      "application/zip": ['.zip'],
    },
    maxSize: 10485760,
    onDropRejected: (file) => {
      if (file[0].errors[0].code === "file-too-large") {
        setDropMessage({ message: messages.fileTooLarge, type: "error" });
      } else if (file[0].errors[0].code === "file-invalid-type") {
        setDropMessage({
          message: messages.wrongTypeUploadFail,
          type: "error",
        });
      } else {
        setDropMessage({ message: messages.fileRejectedFail, type: "error" });
      }
      setTimeout(() => {
        setDropMessage({ message: "", type: "" });
      }, [2500]);
    },
    onDropAccepted: () => {
      setDropMessage({ message: messages.fileAccepted, type: "success" });
      setLoading(true);
    },
    disabled: dropDisabled,
  });
  const [hover, setHover] = useState(false);

  const spinningAnimation =
    "spin 1.5s linear infinite; @keyframes spin {from {transform: rotate(0deg);}to {transform: rotate(-360deg);}";

  const handleHover = () => {
    setHover(true);
  };
  const handleHoverLeave = () => {
    setHover(false);
  };

  const handleDragOver = () => {
    setHover(true);
  };

  const handleDragLeave = () => {
    setHover(false);
  };


  useEffect(() => {
    setFile(acceptedFiles);
  }, [acceptedFiles, setFile]);

  const downloadIconColor = useMemo(() => {
    return dropDisabled === true
      ? CustomPalette.GREY_600
      : hover === true
        ? CustomPalette.SECONDARY
        : CustomPalette.PRIMARY;
  }, [dropDisabled, hover]);

  return (
    <>
      {version === 1 ?
        <LandingDropZone
          dropMessage={dropMessage}
          loading={loading}
          dropDisabled={dropDisabled}
          spinningAnimation={spinningAnimation}
          downloadIconColor={downloadIconColor}
          getRootProps={getRootProps}
          getInputProps={getInputProps}
          hover={hover}
          handleHover={handleHover}
          handleHoverLeave={handleHoverLeave}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
        />
        : <DropCard
          dropMessage={dropMessage}
          loading={loading}
          dropDisabled={dropDisabled}
          spinningAnimation={spinningAnimation}
          downloadIconColor={downloadIconColor}
          getRootProps={getRootProps}
          getInputProps={getInputProps}
          hover={hover}
          handleHover={handleHover}
          handleHoverLeave={handleHoverLeave}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
        />
      }</>
  );
}
