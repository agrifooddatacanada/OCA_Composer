import { DateTime } from "luxon";

export const DEFAULT_LANGUAGE_CODE = "en";
export const DEFAULT_THREE_LETTER_LANGUAGE_CODE = "eng";
export const DEFAULT_LANGUAGE = "English";
export const MAX_ATTR_LABEL_CHARS = 250;
export const MAX_ATTR_DESCRIPTION_CHARS = 250;

export const SCHEMA_MODE_SINGLE = "single";
export const SCHEMA_MODE_MULTI_LEVEL = "multi-level";

export const classification = {
  "": [""],
  "Natural sciences": [
    "Mathematics and statistics",
    "Computer and information sciences",
    "Physical sciences",
    "Chemical sciences",
    "Earth and related environmental sciences",
    "Biological sciences",
    "Other natural sciences"
  ],
  "Engineering and technology": [
    "Civil engineering, maritime engineering, transport engineering, and mining engineering",
    "Industrial, systems and processes engineering",
    "Electrical engineering, computer engineering, and information engineering",
    "Mechanical engineering",
    "Chemical engineering",
    "Materials engineering and resources engineering",
    "Medical and biomedical engineering",
    "Environmental engineering and related engineering",
    "Environmental biotechnology",
    "Industrial biotechnology",
    "Nano-technology",
    "Other engineering and technologies"
  ],
  "Medical and health sciences": [
    "Basic medicine and life sciences",
    "Clinical medicine",
    "Health sciences",
    "Medical biotechnology",
    "Other medical sciences"
  ],
  "Agricultural and veterinary sciences": [
    "Agriculture, forestry, and fisheries",
    "Animal and dairy science",
    "Veterinary science",
    "Agricultural biotechnology and food sciences",
    "Other agricultural sciences"
  ],
  "Social sciences": [
    "Psychology and cognitive sciences",
    "Economics and business administration",
    "Education",
    "Sociology and related studies",
    "Law and legal practice",
    "Political science and policy administration",
    "Social and economic geography",
    "Media and communications",
    "Other social sciences"
  ],
  "Humanities and the arts": [
    "History, archaeology and related studies",
    "Languages and literature",
    "Philosophy",
    "Arts (arts, history of arts, performing arts, music), architecture and design",
    "Other humanities"
  ]
};

export const divisionCodes = {
  "": "",
  "Natural sciences": "RDF10",
  "Engineering and technology": "RDF20-21",
  "Medical and health sciences": "RDF30",
  "Agricultural and veterinary sciences": "RDF40",
  "Social sciences": "RDF50",
  "Humanities and the arts": "RDF60"
};

export const groupCodes = {
  "": "",
  "Mathematics and statistics": "RDF101",
  "Computer and information sciences": "RDF102",
  "Physical sciences": "RDF103",
  "Chemical sciences": "RDF104",
  "Earth and related environmental sciences": "RDF105",
  "Biological sciences": "RDF106",
  "Other natural sciences": "RDF107",
  "Civil engineering, maritime engineering, transport engineering, and mining engineering":
    "RDF201",
  "Industrial, systems and processes engineering": "RDF202",
  "Electrical engineering, computer engineering, and information engineering": "RDF203",
  "Mechanical engineering": "RDF204",
  "Chemical engineering": "RDF205",
  "Materials engineering and resources engineering": "RDF206",
  "Medical and biomedical engineering": "RDF207",
  "Environmental engineering and related engineering": "RDF208",
  "Environmental biotechnology": "RDF209",
  "Industrial biotechnology": "RDF210",
  "Nano-technology": "RDF211",
  "Other engineering and technologies": "RDF212",
  "Basic medicine and life sciences": "RDF301",
  "Clinical medicine": "RDF302",
  "Health sciences": "RDF303",
  "Medical biotechnology": "RDF304",
  "Other medical sciences": "RDF305",
  "Agriculture, forestry, and fisheries": "RDF401",
  "Animal and dairy science": "RDF402",
  "Veterinary science": "RDF403",
  "Agricultural biotechnology and food sciences": "RDF404",
  "Other agricultural sciences": "RDF405",
  "Psychology and cognitive sciences": "RDF501",
  "Economics and business administration": "RDF502",
  Education: "RDF503",
  "Sociology and related studies": "RDF504",
  "Law and legal practice": "RDF505",
  "Political science and policy administration": "RDF506",
  "Social and economic geography": "RDF507",
  "Media and communications": "RDF508",
  "Other social sciences": "RDF509",
  "History, archaeology and related studies": "RDF601",
  "Languages and literature": "RDF602",
  Philosophy: "RDF603",
  "Arts (arts, history of arts, performing arts, music), architecture and design":
    "RDF604",
  "Other humanities": "RDF605"
};

export const codeToDivision = {
  "": "",
  RDF10: "Natural sciences",
  "RDF20-21": "Engineering and technology",
  RDF30: "Medical and health sciences",
  RDF40: "Agricultural and veterinary sciences",
  RDF50: "Social sciences",
  RDF60: "Humanities and the arts"
};

export const codeToGroup = {
  "": "",
  RDF101: "Mathematics and statistics",
  RDF102: "Computer and information sciences",
  RDF103: "Physical sciences",
  RDF104: "Chemical sciences",
  RDF105: "Earth and related environmental sciences",
  RDF106: "Biological sciences",
  RDF107: "Other natural sciences",
  RDF201:
    "Civil engineering, maritime engineering, transport engineering, and mining engineering",
  RDF202: "Industrial, systems and processes engineering",
  RDF203: "Electrical engineering, computer engineering, and information engineering",
  RDF204: "Mechanical engineering",
  RDF205: "Chemical engineering",
  RDF206: "Materials engineering and resources engineering",
  RDF207: "Medical and biomedical engineering",
  RDF208: "Environmental engineering and related engineering",
  RDF209: "Environmental biotechnology",
  RDF210: "Industrial biotechnology",
  RDF211: "Nano-technology",
  RDF212: "Other engineering and technologies",
  RDF301: "Basic medicine and life sciences",
  RDF302: "Clinical medicine",
  RDF303: "Health sciences",
  RDF304: "Medical biotechnology",
  RDF305: "Other medical sciences",
  RDF401: "Agriculture, forestry, and fisheries",
  RDF402: "Animal and dairy science",
  RDF403: "Veterinary science",
  RDF404: "Agricultural biotechnology and food sciences",
  RDF405: "Other agricultural sciences",
  RDF501: "Psychology and cognitive sciences",
  RDF502: "Economics and business administration",
  RDF503: "Education",
  RDF504: "Sociology and related studies",
  RDF505: "Law and legal practice",
  RDF506: "Political science and policy administration",
  RDF507: "Social and economic geography",
  RDF508: "Media and communications",
  RDF509: "Other social sciences",
  RDF601: "History, archaeology and related studies",
  RDF602: "Languages and literature",
  RDF603: "Philosophy",
  RDF604: "Arts (arts, history of arts, performing arts, music), architecture and design",
  RDF605: "Other humanities"
};

export const dataTypes = [
  "Binary",
  "Boolean",
  "DateTime",
  "Numeric",
  "Text",
  "Child Schema",
  "Array[Binary]",
  "Array[Boolean]",
  "Array[DateTime]",
  "Array[Numeric]",
  "Array[Text]",
  "Array[Child Schema]"
];

export const descriptionToFormatCodeText = {
  "": "",
  "Entries of any length with only capital letters": "^[A-Z]*$",
  "Capital or lower case letters only, at least 1 character, and 50 characters max":
    "^[A-Za-z]{1,50}$",
  "Capital or lower case letters only, 50 characters max": "^[A-Za-z]{0,50}$",
  "Short text, 50 characters max": "^.{0,50}$",
  "Short text, 250 characters max": "^.{0,250}$",
  "long text, 800 characters max": "^.{0,800}$",
  "long text, 4000 characters max": "^.{0,4000}$",
  "Canadian postal codes (A1A 1A1)": "^[A-Z][0-9][A-Z]\\s[0-9][A-Z][0-9]$",
  "Zip code": "^\\d{5,6}(?:[-\\s]\\d{4})?$",
  "Email address": "[a-zA-Z0-9_\\.\\+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-\\.]+",
  URL: "https?\\:\\/\\/[a-zA-Z0-9\\-\\.]+\\.[a-zA-Z]{2,}",
  "Phone number": "\\+?\\(?\\d{2,4}\\)?[\\d\\s-]{3,}",
  // eslint-disable-next-line quotes
  'Latitude in formats S30°15\'45.678" or N12°30.999"':
    // eslint-disable-next-line quotes
    `^[NS]\\s?(?:[0-8]?\\d)°\\s?(?:[0-5]?\\d)'?\\s?(?:[0-5]?\\d(?:\\.\\d+)?)"?$`,
  // eslint-disable-next-line quotes
  'Longitude in formats E30°15\'45.678" or W90°00.000"':
    // eslint-disable-next-line quotes
    `^[EW]\\s?(?:1[0-7]\\d|0?\\d{1,2})°\\s?(?:[0-5]?\\d)'?\\s?(?:[0-5]?\\d(?:\\.\\d+)?)"?$`,
  "DNA: (ATGC)": "^[ATGC]+$",
  "DNA: (ATGCRYSWKMBDHVN)": "^[ATGCRYSWKMBDHVN]+$",
  "RNA: (AUGC)": "^[AUGC]+$",
  "RNA: (AUGCRYSWKMBDHVN)": "^[AUGCRYSWKMBDHVN]+$",
  "Protein: (ACDEFGHIKLMNPQRSTVWY)": "^[ACDEFGHIKLMNPQRSTVWY]+$",
  "Protein: (ACDEFGHIKLMNPQRSTVWYBZJXUO)": "^[ACDEFGHIKLMNPQRSTVWYBZJXUO]+$"
};

export const formatCodeText = Object.keys(descriptionToFormatCodeText);

export const formatCodeTextDescription = Object.entries(
  descriptionToFormatCodeText
).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {});

export const descriptionToFormatCodeNumeric = {
  "": "",
  "any integer or decimal number, may begin with + or -": "^[-+]?\\d*\\.?\\d+$",
  // "decimal numbers between 0 and 1, inclusive": "^(0?(\\.\\d+)?|1(\\.0+)?)$",
  // "positive integers": "^[0-9]*[1-9][0-9]*$",
  "any integer": "^-?[0-9]+$"
  // "any number between 0 and 100, inclusive": "^(100(\\.0+)?|0*([1-9]?\\d(\\.\\d+)?)|0)$",
};

export const formatCodeNumeric = Object.keys(descriptionToFormatCodeNumeric);

export const formatCodeNumericDescription = Object.entries(
  descriptionToFormatCodeNumeric
).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {});

export const descriptionToFormatCodeDate = {
  "": "",
  "ISO: YYYY-MM-DD: year month day": "^(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$",
  "ISO: YYYYMMDD: year month day": "^(\\d{4})(0[1-9]|1[0-2])(0[1-9]|[1-2]\\d|3[0-1])$",
  "ISO: YYYY-MM: year month": "^(\\d{4})-(0[1-9]|1[0-2])$",
  "ISO: YYYY-Www: year week (e.g. W01)": "^(?:\\d{4})-W(0[1-9]|[1-4][0-9]|5[0-3])$",
  "ISO: YYYYWww: year week (e.g. W01)": "^(?:\\d{4})W(0[1-9]|[1-4][0-9]|5[0-3])$",
  "ISO: YYYY-DDD: Ordinal date (day number from the year)":
    "^(?:\\d{4})-(00[1-9]|0[1-9][0-9]|[1-2][0-9]{2}|3[0-5][0-9]|36[0-6])$",
  "ISO: YYYYDDD: Ordinal date (day number from the year)":
    "^(?:\\d{4})(00[1-9]|0[1-9][0-9]|[1-2][0-9]{2}|3[0-5][0-9]|36[0-6])$",
  "ISO: YYYY: year": "^(\\d{4})$",
  "ISO: MM: month": "^(0[1-9]|1[0-2])$",
  "ISO: DD: day": "^(0[1-9]|[1-2][0-9]|3[01])$",
  "ISO: YYYY-MM-DDTHH:MM:SSZ: Date and Time Combined (UTC)":
    "^(?:\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])T([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)Z$",
  "ISO: YYYY-MM-DDTHH:MM:SS±hh:mm: Date and Time Combined (with Timezone Offset)":
    "^(?:\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])T([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)([+-][01]\\d:[0-5]\\d)$",
  "ISO: PnD: accumulated days (n days)": "^P\\d+D$",
  "ISO: PnYnMnDTnHnMnS :durations e.g. P3Y6M4DT12H30M5S":
    "^P(?!$)((\\d+Y)|(\\d+\\.\\d+Y))?((\\d+M)|(\\d+\\.\\d+M))?((\\d+W)|(\\d+\\.\\d+W))?((\\d+D)|(\\d+\\.\\d+D))?(T(?=\\d)((\\d+H)|(\\d+\\.\\d+H))?((\\d+M)|(\\d+\\.\\d+M))?(\\d+(\\.\\d+)?S)?)?$",
  "ISO: HH:MM: hour, minutes in 24 hour notation": "^([01]\\d|2[0-3]):([0-5]\\d)$",
  "ISO: HH:MM:SS: hour, minutes, seconds in 24 hour notation":
    "^([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)$",
  "DD/MM/YYYY: day, month, year": "^(0[1-9]|[12]\\d|3[01])/(0[1-9]|1[0-2])/\\d{4}$",
  "DD/MM/YY: day, month, year": "^(0[1-9]|[12]\\d|3[01])/(0[1-9]|1[0-2])/\\d{2}$",
  "MM/DD/YYYY: month, day, year": "^(0[1-9]|1[0-2])/(0[1-9]|[12]\\d|3[01])/\\d{4}$",
  "DDMMYYYY: day, month, year": "^(0[1-9]|[12]\\d|3[01])(0[1-9]|1[0-2])\\d{4}$",
  "MMDDYYYY: month, day, year": "^(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{4}$",
  "YYYYMMDD: year, month, day": "^(\\d{4})(0[1-9]|1[0-2])(0[1-9]|[1-2]\\d|3[0-1])$",
  "HH:MM:SS: hour, minutes, seconds 12 hour notation AM/PM":
    "^(0?[1-9]|1[0-2]):[0-5][0-9]:[0-5][0-9] ?[APMapm]{2}$",
  "H:MM or HH:MM: hour, minutes AM/PM": "^(0?[1-9]|1[0-2]):[0-5][0-9] ?[APMapm]{2}$"
};

export const formatCodeDate = Object.keys(descriptionToFormatCodeDate);

export const formatCodeDateDescription = Object.entries(
  descriptionToFormatCodeDate
).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {});

// These are not ISO 8601 formats
export const customDateFormatParsers = [
  {
    name: "ISO: MM",
    regex: /^(0[1-9]|1[0-2])$/,
    parse: (str) => DateTime.fromFormat(str, "MM")
  },
  {
    name: "ISO: DD",
    regex: /^(0[1-9]|[1-2][0-9]|3[01])$/,
    parse: (str) => DateTime.fromFormat(str, "dd")
  },
  {
    name: "DD/MM/YYYY",
    regex: /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
    parse: (str) => DateTime.fromFormat(str, "dd/MM/yyyy")
  },
  {
    name: "DD/MM/YY",
    regex: /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{2}$/,
    parse: (str) => DateTime.fromFormat(str, "dd/MM/yy")
  },
  {
    name: "MM/DD/YYYY",
    regex: /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/,
    parse: (str) => DateTime.fromFormat(str, "MM/dd/yyyy")
  },
  {
    name: "DDMMYYYY",
    regex: /^(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])\d{4}$/,
    parse: (str) => DateTime.fromFormat(str, "ddMMyyyy")
  },
  {
    name: "MMDDYYYY",
    regex: /^(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{4}$/,
    parse: (str) => DateTime.fromFormat(str, "MMddyyyy")
  },
  {
    name: "HH:MM:SS AM/PM",
    regex: /^(0?[1-9]|1[0-2]):[0-5][0-9]:[0-5][0-9] ?[APMapm]{2}$/,
    parse: (str) => DateTime.fromFormat(str, "h:mm:ss a")
  },
  {
    name: "H:MM or HH:MM AM/PM",
    regex: /^(0?[1-9]|1[0-2]):[0-5][0-9] ?[APMapm]{2}$/,
    parse: (str) => DateTime.fromFormat(str, "h:mm a")
  }
];

export const descriptionToFormatCodeBinary = {
  "": "",
  "Electronic publication (EPUB)": "application/epub+zip",
  "GZip Compressed Archive": "application/gzip",
  "JSON format (.json)": "application/json",
  "JSON-LD format": "application/ld+json",
  "Microsoft word": "application/msword",
  ".bin data": "application/octet-stream",
  "Adobe Portable Document Format (PDF)": "application/pdf",
  "Microsoft Excel (.xls)": "application/vnd.ms-excel",
  "Microsoft Excel (OpenXML) (.xlsx)":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "Microsoft Word (OpenXML)":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "C-shell script": "application/x-csh",
  "HXTML (.xhtml)": "application/xhtml+xml",
  "ZIP archive (.zip)": "application/zip",
  "AAC audio (.aac)": "audio/aac",
  "mpeg audio (.mp3)": "audio/mpeg",
  "ogg audio": "audio/ogg",
  "Waveform audio format (.wav)": "audio/wav",
  "Windows Bitmap graphics": "image/bmp",
  "Graphics Interchange Format (GIF)": "image/gif",
  "JPEG images": "image/jpg",
  "Portable Network Graphics images (.png)": "image/png",
  "Scalable Vector Graphics (SVG)": "image/svg+xml",
  "Tagged Image File Format (TIFF)": "image/tiff",
  "iCalendar format": "text/calendar",
  "comma-separated values (CSV)": "text/csv",
  "JavaScript (.js)": "text/javascript",
  "markdown text": "text/markdown",
  "Plain text (.txt)": "text/plain",
  "Microsoft Word (OpenXML) (.docx)": "text/xml",
  "MP4 video": "video/mp4",
  "raw video": "video/raw"
};

export const formatCodeBinary = Object.keys(descriptionToFormatCodeBinary);

export const formatCodeBinaryDescription = Object.entries(
  descriptionToFormatCodeBinary
).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {});

export const displayValues = [
  "",
  "base64",
  "utf-8",
  "iso-8859-1"
  // "UTF-16LE"
];

export const dataStandardOptions = [
  "urn:iso:std:iso:2560:ed-3:v1:en",
  "urn:iso:std:iso:14001:ed-3:v1:en",
  "urn:iso:std:iso:8601:ed-4:v1:en"
];

export const defaultUploadedDescription =
  "Click here to select a spreadsheet or drag and drop one here";
export const jsonUploadDescription =
  "Click here to select an OCA schema or drag and drop one here";
export const dewvSchemaUploadDescription =
  "Click here to select a machine-readable OCA schema bundle or drag and drop one here";
export const textUploadDescription =
  "Click here to select schema bundle (.zip OR .json) or drag and drop one here";
export const datasetUploadDescription =
  "Click here to select an Excel or CSV dataset or drag and drop one here";
export const defaultTooltip =
  "To make it easier to create a schema you can drag and drop your existing dataset that...";
export const jsonUploadTooltip =
  "To make it easier to upload a schema you can drag and drop your existing dataset that you are creating the schema for. This schema should be in JSON format";
export const dewcSchemaUploadTooltip =
  "To make it easier to upload a schema you can drag and drop your existing dataset that you are creating the schema for. This schema should be the machine-readable schema bundle generated from the Semantic Engine.";
export const datasetUploadTooltip =
  "To make it easier to upload a dataset you can drag and drop your existing dataset that you are creating the schema for. This dataset should be in table format as an Excel or .csv format";
export const defaultNoteDescription =
  "Note: None of this data will be uploaded to a server and all processing happens on device.";

export const errorCode = {
  Format: "FE",
  "Entry Codes": "EC",
  "Character Encoding": "CHE",
  "Data Type": "DTE",
  Range: "RE"
};

export const OVERLAYS_WORD = "overlays";
export const CAPTURE_BASE = "capture_base";
export const CHARACTER_ENCODING = "character_encoding";
export const FORMAT = "format";
export const META = "meta";
export const LABEL = "label";
export const INFORMATION = "information";
export const ENTRY_CODE = "entry_code";
export const ENTRY = "entry";
export const UNIT = "unit";
export const CONFORMANCE = "conformance";
export const CARDINALITY = "cardinality";

export const ORDERING = "ordering";

// Unit Framing Overlay
export const UNIT_FRAMING = "unit_framing";
export const UNIT_FRAME_ID = "UCUM";
export const UNIT_FRAME_LABEL = "Unified Code for Units of Measure";
export const UNIT_FRAME_LOCATION = "https://ucum.org/";
export const UNIT_FRAME_VERSION = "";

// Sensitive overlay (flagged attributes)
export const SENSITIVE = "sensitive";

// Range overlay
export const RANGE = "range";

// Attribute Framing Overlay
export const ATTRIBUTE_FRAMING = "attribute_framing";

export const overlays = [
  CHARACTER_ENCODING,
  FORMAT,
  META,
  LABEL,
  INFORMATION,
  ENTRY_CODE,
  ENTRY,
  UNIT,
  CONFORMANCE
];

export const extensionOverlays = [ORDERING];

export const SHOW_ALL_DATA = "Show all data";
export const SHOW_ONLY_ROWS_WITH_ERRORS = "Show only rows with errors";
export const OCA_REPOSITORY_API_URL = "https://api.adc.oca-repo.semanticengine.org";
export const SSSOM_MAPPER_API_URL = "https://api.adc.sssom-mapper.semanticengine.org";

export const ALLOWED_BOOLEAN_VALUES = [
  "True",
  "true",
  "TRUE",
  "T",
  "1",
  "1.0",
  "False",
  "false",
  "FALSE",
  "F",
  "0",
  "0.0",
  "yes",
  "Yes",
  "YES",
  "Y",
  "no",
  "No",
  "NO",
  "N",
  "Non",
  "non",
  "Oui",
  "oui"
];

export const MAX_FILE_SIZE = 10485760;
export const DISALLOWED_CHARACTERS = [",", " ", "\\", "/", "(", ")", "'", "+", "%"];
export const ADC = "adc";
export const CUSTOM_FORMAT_RULE = "CustomFormatRule";

// Fields for overlay items
export const FIELD_CHARACTER_ENCODING_OVERLAY = "Character Encoding";
export const FIELD_FORMAT_OVERLAY = "Add format rule for data";
export const FIELD_CONFORMANCE_OVERLAY = "Make selected entries required";
export const FIELD_CARDINALITY_OVERLAY = "Cardinality";
export const FIELD_DATA_STANDARDS_OVERLAY = "Data Standards";
export const FIELD_UNIT_FRAMING_OVERLAY = "Unit Framing";
export const FIELD_RANGE_OVERLAY = "Add range rule for data";
export const FIELD_ATTRIBUTE_FRAMING_OVERLAY = "Attribute Framing";

// Attribute Framing Overlay Dropdown Options
export const ATTRIBUTE_FRAMING_DROPDOWN_OPTIONS = {
  typeOfMatch: [
    { value: "skos:exactMatch", label: "skos:exactMatch" },
    { value: "skos:broadMatch", label: "skos:broadMatch" },
    { value: "skos:narrowMatch", label: "skos:narrowMatch" },
    { value: "skos:closeMatch", label: "skos:closeMatch" },
    { value: "skos:relatedMatch", label: "skos:relatedMatch" }
  ],
  mappingJustification: [
    { value: "semapv:ManualMappingCuration", label: "semapv:ManualMappingCuration" },
    { value: "semapv:MappingReview", label: "semapv:MappingReview" },
    { value: "semapv:LogicalReasoning", label: "semapv:LogicalReasoning" },
    { value: "semapv:LexicalMatching", label: "semapv:LexicalMatching" },
    { value: "semapv:CompositeMatching", label: "semapv:CompositeMatching" },
    { value: "semapv:UnspecifiedMatching", label: "semapv:UnspecifiedMatching" },
    {
      value: "semapv:SemanticSimilarityThresholdMatching",
      label: "semapv:SemanticSimilarityThresholdMatching"
    },
    {
      value: "semapv:LexicalSimilarityThresholdMatching",
      label: "semapv:LexicalSimilarityThresholdMatching"
    },
    { value: "semapv:MappingChaining", label: "semapv:MappingChaining" }
  ]
};
