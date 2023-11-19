import { createRef, useContext, useEffect, useRef, useState } from "react";
import { Context } from "../App";
import { Box, MenuItem } from "@mui/material";
import { DropdownMenuList } from "../components/DropdownMenuCell";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { CustomPalette } from "../constants/customPalette";

const formatCodeText = [
  "",
  "^[A-Z]*$",
  "^[A-Za-z]{1,50}$",
  "^[A-Za-z]{0,50}$",
  "^.{0,50}$",
  "^.{0,250}$",
  "^.{0,800}$",
  "^.{0,4000}$",
  "^[A-Z][0-9][A-Z]\\s[0-9][A-Z][0-9]$",
  "^\\d{5,6}(?:[-\\s]\\d{4})?$",
  "[a-zA-Z0-9_\\.\\+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-\\.]+",
  "https?\\:\\/\\/[a-zA-Z0-9\\-\\.]+\\.[a-zA-Z]{2,}",
  "\\+?\\(?\\d{2,4}\\)?[\\d\\s-]{3,}"
];

const formatCodeNumeric = [
  "^[-+]?\\d*\\.?\\d+$",
  "^(0?(\\.\\d+)?|1(\\.0+)?)$",
  "^[0-9]*[1-9][0-9]*$",
  "^-?[0-9]+$",
  "^(100(\\.0+)?|0*([1-9]?\\d(\\.\\d+)?)|0)$"
];

const formatCodeDate = [
  "YYYY-MM-DD",
  "YYYYMMDD",
  "YYYY-MM",
  "YYYY-Www",
  "YYYYWww",
  "YYYY-MM-DDThh:mm:ssZ",
  "hh:mm:ss",
  "PnYnMnD",
  "YYYY-DDD",
  "YYYYDDD"
];

const formatCodeBinary = [
  "application/epub+zip",
  "application/gzip",
  "application/json",
  "application/ld+json",
  "application/msword",
  "application/octet-stream",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/x-csh",
  "application/xhtml+xml",
  "application/zip",
  "audio/aac",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "image/bmp",
  "image/gif",
  "image/jpg",
  "image/png",
  "image/svg+xml",
  "image/tiff",
  "text/calendar",
  "text/csv",
  "text/javascript",
  "text/markdown",
  "text/plain",
  "text/xml",
  "video/mp4",
  "video/raw"
];

const useFormatTextType = (gridRef) => {
  const { attributesList, formatRuleRowData, setFormatRuleRowData } = useContext(Context);
  const typesObjectRef = useRef({});
  const boxRefs = useRef([]);
  const dropRefs = useRef(formatRuleRowData.map(() => createRef()));
  const [buttonArray, setButtonArray] = useState([]);

  // Load up the typesObjectRef from the characterEncodingRowData
  useEffect(() => {
    const newTypesObjetRef = {};
    formatRuleRowData.forEach((item) => {
      if (item['FormatText'] && item['FormatText'] !== '') {
        newTypesObjetRef[item.Attribute] = item['FormatText'];
      }
    });
    typesObjectRef.current = newTypesObjetRef;
  }, [formatRuleRowData]);

  useEffect(() => {
    dropRefs.current = formatRuleRowData.map(() => createRef());
  }, [attributesList, formatRuleRowData]);

  useEffect(() => {
    console.log('firsttttt');
    console.log('typeObjectReference', typesObjectRef.current);
    if (formatRuleRowData.length > 0) {
      const newButtonArray = [];
      boxRefs.current = [];
      newButtonArray.push(<Box sx={{ height: "2.2rem" }} key={0}></Box>);
      console.log('formatRuleRowData', formatRuleRowData);
      formatRuleRowData.forEach((item, index) => {
        console.log('item', item);
        const ref = createRef();
        boxRefs.current.push(ref);
        newButtonArray.push(
          item.FormatText !== '' ?
            (<Box
              key={index + 1}
              ref={ref}
              sx={{
                ml: 1,
              }}
            >
              <DeleteOutlineIcon
                onClick={() => handleDeleteRow(index)}
                sx={{
                  color: CustomPalette.GREY_600,
                }}
              />
            </Box>) :
            (<Box
              key={index + 1}
              ref={ref}
              sx={{
                ml: 1,
              }}
            >
              <DeleteOutlineIcon
                onClick={() => { }}
                sx={{
                  color: "white",
                }}
              />
            </Box>)
        );

      });
      setButtonArray(newButtonArray);
    }
  }, [formatRuleRowData]);

  const handleDeleteRow = (index) => {
    console.log('index', index);
    const newFormatRuleRowData = [...formatRuleRowData];
    console.log('newFormatRuleRowData', newFormatRuleRowData);
    newFormatRuleRowData[index].FormatText = '';
    setFormatRuleRowData(newFormatRuleRowData);
  };

  const handleSave = () => {
    gridRef.current.api.stopEditing();
    const attributeWithCharacterEncoding = typesObjectRef.current;
    const newFormatTextRowData = [];
    formatRuleRowData.forEach((item) => {
      newFormatTextRowData.push({
        ...item,
        FormatText: attributeWithCharacterEncoding[item.Attribute] || '',
      });
    });
    setFormatRuleRowData(newFormatTextRowData);
  };


  const FormatRuleTypeRenderer = (props) => {
    const attributeName = props.attr;
    let selectedOption = formatCodeText;
    if (attributeName.includes("Date")) {
      selectedOption = formatCodeDate;
    } else if (attributeName.includes("Numeric")) {
      selectedOption = formatCodeNumeric;
    } else if (attributeName.includes("Binary")) {
      selectedOption = formatCodeBinary;
    }
    const [type, setType] = useState(selectedOption[0]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const index = formatRuleRowData.findIndex(
      (item) => item.Attribute === attributeName
    );

    useEffect(() => {
      setType(typesObjectRef.current[attributeName]);
    }, [attributeName]);

    const handleChange = (e) => {
      setType(e.target.value);
      typesObjectRef.current = { ...typesObjectRef.current, [attributeName]: e.target.value };
      // refresh state -> refaxtor this
      const newFormatTextRowData = [];
      formatRuleRowData.forEach((item) => {
        newFormatTextRowData.push({
          ...item,
          FormatText: typesObjectRef.current[item.Attribute] || '',
        });
      });
      setFormatRuleRowData(newFormatTextRowData);
      setIsDropdownOpen(false);
    };

    const handleClick = () => {
      setIsDropdownOpen(!isDropdownOpen);
    };

    const handleKeyDown = (e) => {
      const keyPressed = e.key;
      if (keyPressed === "Delete" || keyPressed === "Backspace") {
        setType("");
        typesObjectRef.current[attributeName] = "";
      }
    };

    const typesDisplay = selectedOption.map((value, index) => (
      <MenuItem
        key={index + "_" + value}
        value={value}
        sx={{ border: "none", height: "2rem", fontSize: "small" }}
      >
        {value}
      </MenuItem>
    ));

    return (
      <DropdownMenuList
        handleKeyDown={handleKeyDown}
        type={type}
        handleChange={handleChange}
        dropRefs={dropRefs.current[index]}
        handleClick={handleClick}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        typesDisplay={typesDisplay}
      />
    );
  };

  return { handleSave, FormatRuleTypeRenderer, buttonArray };
};

export default useFormatTextType;