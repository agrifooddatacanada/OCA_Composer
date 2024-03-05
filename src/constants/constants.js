export const classification = {
  "": [""],
  "Natural sciences": ["Mathematics and statistics", "Computer and information sciences", "Physical sciences", "Chemical sciences", "Earth and related environmental sciences", "Biological sciences", "Other natural sciences"],
  "Engineering and technology": ["Civil engineering, maritime engineering, transport engineering, and mining engineering", "Industrial, systems and processes engineering", "Electrical engineering, computer engineering, and information engineering", "Mechanical engineering", "Chemical engineering", "Materials engineering and resources engineering", "Medical and biomedical engineering", "Environmental engineering and related engineering", "Environmental biotechnology", "Industrial biotechnology", "Nano-technology", "Other engineering and technologies"],
  "Medical and health sciences": ["Basic medicine and life sciences", "Clinical medicine", "Health sciences", "Medical biotechnology", "Other medical sciences"],
  "Agricultural and veterinary sciences": ["Agriculture, forestry, and fisheries", "Animal and dairy science", "Veterinary science", "Agricultural biotechnology and food sciences", "Other agricultural sciences"],
  "Social sciences": ["Psychology and cognitive sciences", "Economics and business administration", "Education", "Sociology and related studies", "Law and legal practice", "Political science and policy administration", "Social and economic geography", "Media and communications", "Other social sciences"],
  "Humanities and the arts": ["History, archaeology and related studies", "Languages and literature", "Philosophy", "Arts (arts, history of arts, performing arts, music), architecture and design", "Other humanities"],
};

export const divisionCodes = {
  "": "",
  "Natural sciences": "RDF10",
  "Engineering and technology": "RDF20-21",
  "Medical and health sciences": "RDF30",
  "Agricultural and veterinary sciences": "RDF40",
  "Social sciences": "RDF50",
  "Humanities and the arts": "RDF60",
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
  "Civil engineering, maritime engineering, transport engineering, and mining engineering": "RDF201",
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
  "Education": "RDF503",
  "Sociology and related studies": "RDF504",
  "Law and legal practice": "RDF505",
  "Political science and policy administration": "RDF506",
  "Social and economic geography": "RDF507",
  "Media and communications": "RDF508",
  "Other social sciences": "RDF509",
  "History, archaeology and related studies": "RDF601",
  "Languages and literature": "RDF602",
  "Philosophy": "RDF603",
  "Arts (arts, history of arts, performing arts, music), architecture and design": "RDF604",
  "Other humanities": "RDF605",
};

export const codeToDivision = {
  "": "",
  "RDF10": "Natural sciences",
  "RDF20-21": "Engineering and technology",
  "RDF30": "Medical and health sciences",
  "RDF40": "Agricultural and veterinary sciences",
  "RDF50": "Social sciences",
  "RDF60": "Humanities and the arts",
};

export const codeToGroup = {
  "": "",
  "RDF101": "Mathematics and statistics",
  "RDF102": "Computer and information sciences",
  "RDF103": "Physical sciences",
  "RDF104": "Chemical sciences",
  "RDF105": "Earth and related environmental sciences",
  "RDF106": "Biological sciences",
  "RDF107": "Other natural sciences",
  "RDF201": "Civil engineering, maritime engineering, transport engineering, and mining engineering",
  "RDF202": "Industrial, systems and processes engineering",
  "RDF203": "Electrical engineering, computer engineering, and information engineering",
  "RDF204": "Mechanical engineering",
  "RDF205": "Chemical engineering",
  "RDF206": "Materials engineering and resources engineering",
  "RDF207": "Medical and biomedical engineering",
  "RDF208": "Environmental engineering and related engineering",
  "RDF209": "Environmental biotechnology",
  "RDF210": "Industrial biotechnology",
  "RDF211": "Nano-technology",
  "RDF212": "Other engineering and technologies",
  "RDF301": "Basic medicine and life sciences",
  "RDF302": "Clinical medicine",
  "RDF303": "Health sciences",
  "RDF304": "Medical biotechnology",
  "RDF305": "Other medical sciences",
  "RDF401": "Agriculture, forestry, and fisheries",
  "RDF402": "Animal and dairy science",
  "RDF403": "Veterinary science",
  "RDF404": "Agricultural biotechnology and food sciences",
  "RDF405": "Other agricultural sciences",
  "RDF501": "Psychology and cognitive sciences",
  "RDF502": "Economics and business administration",
  "RDF503": "Education",
  "RDF504": "Sociology and related studies",
  "RDF505": "Law and legal practice",
  "RDF506": "Political science and policy administration",
  "RDF507": "Social and economic geography",
  "RDF508": "Media and communications",
  "RDF509": "Other social sciences",
  "RDF601": "History, archaeology and related studies",
  "RDF602": "Languages and literature",
  "RDF603": "Philosophy",
  "RDF604": "Arts (arts, history of arts, performing arts, music), architecture and design",
  "RDF605": "Other humanities"
};

export const formatCodeText = [
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

export const formatCodeTextDescription = {
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

export const formatCodeNumeric = [
  "",
  "^[-+]?\\d*\\.?\\d+$",
  "^(0?(\\.\\d+)?|1(\\.0+)?)$",
  "^[0-9]*[1-9][0-9]*$",
  "^-?[0-9]+$",
  "^(100(\\.0+)?|0*([1-9]?\\d(\\.\\d+)?)|0)$"
];

export const formatCodeNumericDescription = {
  "": "",
  "^[-+]?\\d*\\.?\\d+$": "any integer or decimal number, may begin with + or -",
  "^(0?(\\.\\d+)?|1(\\.0+)?)$": "decimal numbers between 0 and 1, inclusive",
  "^[0-9]*[1-9][0-9]*$": "positive integers",
  "^-?[0-9]+$": "any integer",
  "^(100(\\.0+)?|0*([1-9]?\\d(\\.\\d+)?)|0)$": "any number between 0 and 100, inclusive"
};

export const formatCodeDate = [
  "",
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

export const formatCodeDateDescription = {
  "": "",
  "YYYY-MM-DD": "year month day",
  "YYYYMMDD": "year month day",
  "YYYY-MM": "year month",
  "YYYY-Www": "year week (e.g. W01)",
  "YYYYWww": "year week (e.g. W01)",
  "YYYY-DDD": "Ordinal date (day number from beginning of the year)",
  "YYYYDDD": "Ordinal date (day number from beginning of the year)"
};

export const formatCodeBinary = [
  "",
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

export const formatCodeBinaryDescription = {
  "": "",
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

export const displayValues = [
  "",
  "base64",
  "utf-8",
  "iso-8859-1",
  "UTF-16LE"
];

export const defaultUploadedDescription = "Click here to select a spreadsheet or drag and drop one here";
export const jsonUploadDescription = "Click here to select an OCA schema or drag and drop one here";
export const datasetUploadDescription = "Click here to select an Excel or CSV dataset or drag and drop one here";

export const defaultTooltip = (<>
  <div>
    To make it easier to create a schema you can drag and drop your
    existing dataset that you are creating the schema for. This
    dataset should be in table format as an Excel or .csv format.
    The first row must contain the column headers (aka attribute
    names).
  </div>
  <br />
  <div>
    Note that no data leaves your device, and no data is uploaded to
    a server. All the processing to copy the column headers
    (attribute names) into the draft schema happens on your device.
  </div>
</>);

export const jsonUploadTooltip = (
  <div>
    To make it easier to upload a schema you can drag and drop your
    existing dataset that you are creating the schema for. This
    schema should be in JSON format.
  </div>
);

export const datasetUploadTooltip = (
  <div>
    To make it easier to upload a dataset you can drag and drop your
    existing dataset that you are creating the schema for. This
    dataset should be in table format as an Excel or .csv format
  </div>
);

export const defaultNoteDescription = 'Note: None of this data will be uploaded to a server and all processing happens on device.';
