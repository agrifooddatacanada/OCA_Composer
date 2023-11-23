import { createRef, useContext, useEffect, useRef, useState } from "react";
import { Context } from "../App";
import { Box, MenuItem } from "@mui/material";
import { DropdownMenuList } from "../components/DropdownMenuCell";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
// import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
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

const formatCodeTextDescription = {
  "": "",
  "^[A-Z]*$": "Entries of any length with only capital letters",
  "^[A-Za-z]{1,50}$": "Capital or lower case letters only, at least 1 character, and 50 characters max",
  "^[A-Za-z]{0,50}$": "Capital or lower case letters only, 50 characters max",
  "^.{0,50}$": "Short text, 50 characters max",
  "^.{0,250}$": "Short text, 250 characters max",
  "^.{0,800}$": "long text, 800 characters max",
  "^.{0,4000}$": "long text, 4000 characters max",
  "^[A-Z][0-9][A-Z]\\s[0-9][A-Z][0-9]$": "Canadian postal codes (A1A 1A1)",
  "^\\d{5,6}(?:[-\\s]\\d{4})?$": "Zip code",
  "[a-zA-Z0-9_\\.\\+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-\\.]+": "Email address",
  "https?\\:\\/\\/[a-zA-Z0-9\\-\\.]+\\.[a-zA-Z]{2,}": "URL",
  "\\+?\\(?\\d{2,4}\\)?[\\d\\s-]{3,}": "Phone number"
};

const formatCodeNumeric = [
  "^[-+]?\\d*\\.?\\d+$",
  "^(0?(\\.\\d+)?|1(\\.0+)?)$",
  "^[0-9]*[1-9][0-9]*$",
  "^-?[0-9]+$",
  "^(100(\\.0+)?|0*([1-9]?\\d(\\.\\d+)?)|0)$"
];

const formatCodeNumericDescription = {
  "^[-+]?\\d*\\.?\\d+$": "any integer or decimal number, may begin with + or -",
  "^(0?(\\.\\d+)?|1(\\.0+)?)$": "decimal numbers between 0 and 1, inclusive",
  "^[0-9]*[1-9][0-9]*$": "positive integers",
  "^-?[0-9]+$": "any integer",
  "^(100(\\.0+)?|0*([1-9]?\\d(\\.\\d+)?)|0)$": "any number between 0 and 100, inclusive"
};

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

const formatCodeDateDescription = {
  "YYYY-MM-DD": "year month day",
  "YYYYMMDD": "year month day",
  "YYYY-MM": "year month",
  "YYYY-Www": "year week (e.g. W01)",
  "YYYYWww": "year week (e.g. W01)",
  "YYYY-DDD": "Ordinal date (day number from beginning of the year)",
  "YYYYDDD": "Ordinal date (day number from beginning of the year)"
};

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

const formatCodeBinaryDescription = {
  "application/epub+zip": "Electronic publication (EPUB)",
  "application/gzip": "GZip Compressed Archive",
  "application/json": "JSON format (.json)",
  "application/ld+json": "JSON-LD format",
  "application/msword": "Microsoft word",
  "application/octet-stream": ".bin data",
  "application/pdf": "Adobe Portable Document Format (PDF)",
  "application/vnd.ms-excel": "Microsoft Excel (.xls)",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Microsoft Excel (OpenXML) (.xlsx)",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Microsoft Word (OpenXML)",
  "application/x-csh": "C-shell script",
  "application/xhtml+xml": "HXTML (.xhtml)",
  "application/zip": "ZIP archive (.zip)",
  "audio/aac": "AAC audio (.aac)",
  "audio/mpeg": "mpeg audio (.mp3)",
  "audio/ogg": "ogg audio",
  "audio/wav": "Waveform audio format (.wav)",
  "image/bmp": "Windows Bitmap graphics",
  "image/gif": "Graphics Interchange Format (GIF)",
  "image/jpg": "JPEG images",
  "image/png": "Portable Network Graphics images (.png)",
  "image/svg+xml": "Scalable Vector Graphics (SVG)",
  "image/tiff": "Tagged Image File Format (TIFF)",
  "text/calendar": "iCalendar format",
  "text/csv": "comma-separated values (CSV)",
  "text/javascript": "JavaScript (.js)",
  "text/markdown": "markdown text",
  "text/plain": "Plain text (.txt)",
  "text/xml": "Microsoft Word (OpenXML) (.docx)",
  "video/mp4": "MP4 video",
  "video/raw": "raw video"
};

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
    if (formatRuleRowData.length > 0) {
      const newButtonArray = [];
      boxRefs.current = [];
      newButtonArray.push(<Box sx={{ height: "2.2rem" }} key={0}></Box>);
      formatRuleRowData.forEach((item, index) => {
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
    const newFormatRuleRowData = [...formatRuleRowData];
    newFormatRuleRowData[index].FormatText = '';
    setFormatRuleRowData(newFormatRuleRowData);
  };

  const handleSave = () => {
    gridRef.current.api.stopEditing();
    // const attributeWithCharacterEncoding = typesObjectRef.current;
    // const newFormatTextRowData = [];
    // formatRuleRowData.forEach((item) => {
    //   newFormatTextRowData.push({
    //     ...item,
    //     FormatText: attributeWithCharacterEncoding[item.Attribute] || '',
    //   });
    // });
    // setFormatRuleRowData(newFormatTextRowData);
  };


  const FormatRuleTypeRenderer = (props) => {
    const attributeName = props.attr;
    const attributeType = props.data.Type;
    let selectedOption = [];
    if (attributeType.includes("Date")) {
      selectedOption = formatCodeDate;
    } else if (attributeType.includes("Numeric")) {
      selectedOption = formatCodeNumeric;
    } else if (attributeType.includes("Binary")) {
      selectedOption = formatCodeBinary;
    } else if (attributeType.includes("Text")) {
      selectedOption = formatCodeText;
    }

    const [type, setType] = useState(typesObjectRef.current[attributeName]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const index = formatRuleRowData.findIndex(
      (item) => item.Attribute === attributeName
    );

    // useEffect(() => {
    //   setType(typesObjectRef.current[attributeName]);
    // }, [attributeName]);

    const handleChange = (e) => {
      setType(e.target.value);
      typesObjectRef.current = { ...typesObjectRef.current, [attributeName]: e.target.value };
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

    const typesDisplay = selectedOption.map((value, index) => {
      const description = attributeType.includes("Date") ? formatCodeDateDescription[value] : attributeType.includes("Numeric") ? formatCodeNumericDescription[value] : attributeType.includes("Binary") ? formatCodeBinaryDescription[value] : attributeType.includes("Text") ? formatCodeTextDescription[value] : "";

      return (
        <MenuItem
          key={index + "_" + value}
          value={value}
          sx={{ border: "none", height: "2rem", fontSize: "small" }}
        >
          <strong>{value}</strong> {description && <span> : {description}</span>}
        </MenuItem>
      );
    });

    return (
      <>
        {
          selectedOption.length > 0 ?
            <DropdownMenuList
              handleKeyDown={handleKeyDown}
              type={type}
              handleChange={handleChange}
              dropRefs={dropRefs.current[index]}
              handleClick={handleClick}
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              typesDisplay={typesDisplay}
            /> :
            <></>
        }
      </>
    );
  };

  return { handleSave, FormatRuleTypeRenderer, buttonArray };
};

export default useFormatTextType;