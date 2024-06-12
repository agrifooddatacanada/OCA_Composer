import { useContext, useEffect, useState } from 'react';
import { Context } from '../App';
import { messages } from '../constants/messages';

const useHandleOCAFileUpload = () => {
  const { setCurrentOCAMergePage, OCAFile1Raw, setOCAFile1Raw, OCAFile2Raw, setOCAFile2Raw, parsedOCAFile1, setParsedOCAFile1, parsedOCAFile2, setParsedOCAFile2, setSelectedOverlaysOCAFile1, setSelectedOverlaysOCAFile2 } = useContext(Context);
  const [OCAFile1Loading, setOCAFile1Loading] = useState(false);
  const [OCAFile2Loading, setOCAFile2Loading] = useState(false);
  const [ocaFile1DropDisabled, setOcaFile1DropDisabled] = useState(false);
  const [ocaFile1DropMessage, setOcaFile1DropMessage] = useState("");
  const [ocaFile2DropDisabled, setOcaFile2DropDisabled] = useState(false);
  const [ocaFile2DropMessage, setOcaFile2DropMessage] = useState("");

  const handleClearOCAFile1 = () => {
    setOcaFile1DropDisabled(false);
    setOCAFile1Raw([]);
    setParsedOCAFile1("");
  };

  const handleClearOCAFile2 = () => {
    setOcaFile2DropDisabled(false);
    setOCAFile2Raw([]);
    setParsedOCAFile2("");
  };

  const processOcaFile = (splittedText) => {
    const result = {};
    splittedText.forEach((line) => {
      if (line !== "") {
        const match = line.match(/ADD\s(.*?)\sATTRS/);
        if (match && match[1] && !(match[1] in result)) {
          // result.push(match[1]);
          result[match[1]] = [line];
        } else if (match && match[1] && match[1] in result) {
          result[match[1]].push(line);
        }

        const matchProps = line.match(/ADD\s(.*?)\sPROPS/);
        if (matchProps && matchProps[1] && !(matchProps[1] in result)) {
          // result.push(matchProps[1]);
          result[matchProps[1]] = [line];
        } else if (matchProps && matchProps[1] && matchProps[1] in result) {
          result[matchProps[1]].push(line);
        }

        const matchAttribute = line.match(/ADD\sATTRIBUTE/);
        if (matchAttribute && !("ATTRIBUTE" in result)) {
          // result.push("ATTRIBUTE");
          result["ATTRIBUTE"] = [line];
        } else if (matchAttribute && "ATTRIBUTE" in result) {
          result["ATTRIBUTE"].push(line);
        }
      }
    });

    return result;
  };

  const processTextFile = (file, fileNumber) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (fileNumber === 1) {
        setParsedOCAFile1(text);
        const processedData = processOcaFile(text.split("\n"));
        setSelectedOverlaysOCAFile1(processedData);
        setOCAFile1Loading(false);
        setOcaFile1DropDisabled(true);
        setOcaFile1DropMessage({
          message: messages.successfulUpload,
          type: "success",
        });

        setTimeout(() => {
          setOcaFile1DropDisabled(true);
          setOcaFile1DropMessage({ message: "", type: "" });
          setOCAFile2Loading(false);
          if (OCAFile2Raw.length === 0) {
            setOcaFile2DropDisabled(false);
          }
        }, 900);
      } else {
        const processedData = processOcaFile(text.split("\n"));
        setSelectedOverlaysOCAFile2(processedData);

        setParsedOCAFile2(text);
        setOCAFile2Loading(false);
        setOcaFile2DropDisabled(true);

        setOcaFile2DropMessage({
          message: messages.successfulUpload,
          type: "success",
        });

        setTimeout(() => {
          setOcaFile2DropMessage({ message: "", type: "" });
          setOCAFile1Loading(false);
          if (OCAFile1Raw.length === 0) {
            setOcaFile1DropDisabled(false);
          }
        }, 900);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (OCAFile1Raw && OCAFile1Raw.length > 0 && OCAFile1Raw[0].path.includes(".txt") && parsedOCAFile1 === "") {
      processTextFile(OCAFile1Raw[0], 1);
    } else if (OCAFile2Raw && OCAFile2Raw.length > 0 && OCAFile2Raw[0].path.includes(".txt") && parsedOCAFile2 === "") {
      processTextFile(OCAFile2Raw[0], 2);
    } else if (OCAFile2Raw && OCAFile2Raw.length > 0 && parsedOCAFile2 === "") {
      setOcaFile2DropMessage({ message: messages.uploadFail, type: "error" });
      setOCAFile2Loading(false);
      setOCAFile1Loading(false);
      if (OCAFile1Raw.length === 0) {
        setOcaFile1DropDisabled(false);
      }
      setTimeout(() => {
        setOcaFile2DropMessage({ message: "", type: "" });
      }, [2500]);
    } else if (OCAFile1Raw && OCAFile1Raw.length > 0 && parsedOCAFile1 === "") {
      setOcaFile1DropMessage({ message: messages.uploadFail, type: "error" });
      setOCAFile1Loading(false);
      setOCAFile2Loading(false);
      if (OCAFile2Raw.length === 0) {
        setOcaFile2DropDisabled(false);
      }
      setTimeout(() => {
        setOcaFile1DropMessage({ message: "", type: "" });
      }, [2500]);
    }
  }, [OCAFile1Raw, OCAFile2Raw]);

  return {
    setCurrentOCAMergePage,
    setOCAFile1Raw,
    setOCAFile2Raw,
    OCAFile1Loading,
    setOCAFile1Loading,
    OCAFile2Loading,
    setOCAFile2Loading,
    ocaFile1DropDisabled,
    setOcaFile1DropMessage,
    ocaFile1DropMessage,
    ocaFile2DropDisabled,
    setOcaFile2DropMessage,
    ocaFile2DropMessage,
    OCAFile1Raw,
    OCAFile2Raw,
    handleClearOCAFile1,
    handleClearOCAFile2,
    parsedOCAFile1,
    parsedOCAFile2,
  };
};

export default useHandleOCAFileUpload;