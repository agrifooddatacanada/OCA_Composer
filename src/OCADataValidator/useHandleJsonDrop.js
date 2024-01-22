import { useCallback, useContext, useEffect, useState } from "react";
import { messages } from "../constants/messages";
import { Context } from "../App";

export const useHandleJsonDrop = () => {
  const { setCurrentDataValidatorPage } = useContext(Context);
  const [jsonRawFile, setJsonRawFile] = useState(null);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [jsonDropDisabled, setJsonDropDisabled] = useState(false);
  const [jsonDropMessage, setJsonDropMessage] = useState({ message: "", type: "" });

  const handleJsonDrop = useCallback((acceptedFiles) => {
    try {
      setJsonRawFile(true);
      const reader = new FileReader();

      reader.onload = async (e) => {
        const jsonFile = JSON.parse(e.target.result)?.['bundle'];
        console.log('jsonFile', jsonFile);
      };

      reader.readAsText(acceptedFiles[0]);

      setTimeout(() => {
        setJsonDropDisabled(true);
        setJsonDropMessage({ message: "", type: "" });
        setJsonLoading(false);
        setCurrentDataValidatorPage("SchemaViewDataValidator");
      }, 900);
    } catch (error) {
      setJsonDropMessage({ message: messages.uploadFail, type: "error" });
      setJsonLoading(false);
      setTimeout(() => {
        setJsonDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, []);

  useEffect(() => {
    if (jsonRawFile && jsonRawFile.length > 0 && jsonRawFile[0].path.includes(".json")) {
      handleJsonDrop(jsonRawFile);
    } else if (jsonRawFile && jsonRawFile.length > 0) {
      setJsonDropMessage({ message: messages.uploadFail, type: "error" });
      setJsonLoading(false);
      setTimeout(() => {
        setJsonDropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, [handleJsonDrop, jsonRawFile]);

  return {
    jsonRawFile,
    setJsonRawFile,
    jsonLoading,
    setJsonLoading,
    jsonDropDisabled,
    setJsonDropDisabled,
    jsonDropMessage,
    setJsonDropMessage
  };
};
