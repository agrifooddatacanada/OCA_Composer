import { createDEE } from "./createDEE";

export function generateDataEntry(acceptedFiles, setLoading, selectedLang) {
  let workbook = null;
  try {
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        workbook = await createDEE(e, selectedLang);
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "data_entry.xlsx";
        a.click();
      } catch (error) {
        console.error("Error processing file:", error);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      setLoading(false);
    };

    reader.readAsArrayBuffer(acceptedFiles[0]);
  } catch (error) {
    console.error("Unexpected error:", error);
    setLoading(false);
  }
}
