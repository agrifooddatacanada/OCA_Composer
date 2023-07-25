import React, { useEffect } from "react";
import { useDropzone } from "react-dropzone";
import DropCard from "./DropCard";
import { messages } from "../constants/messages";

export default function Drop({
  setFile,
  setLoading,
  loading,
  dropDisabled,
  dropMessage,
  setDropMessage,
  zipEntries,
  processFileInZip
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

  useEffect(() => {
    setFile(acceptedFiles);
  }, [acceptedFiles, setFile]);

  return (
    <section
      className="container"
      style={{ height: "16rem", marginTop: "3rem", marginBottom: "1rem" }}
    >
      <div {...getRootProps({ className: "dropzone" })}>
        <input {...getInputProps()} />
        <DropCard
          dropMessage={dropMessage}
          loading={loading}
          dropDisabled={dropDisabled}
          zipEntries={zipEntries}
          processFileInZip={processFileInZip}
        />
      </div>
    </section>
  );
}
