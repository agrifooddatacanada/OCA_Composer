export const CATALOGUE_INFO_KEY = "catalogueInfo";
export const catalogueScenarios = ["General", "Data Hub"];

// ICT groups of these scenarios should be included as parent groups in the markdown readme
export const scenarioParentIctGroupMap = {
  "Data Hub": true
};

export const catalogueInfoFormFields = {
  General: [
    {
      label: "Author",
      name: "author",
      type: "text",
      placeholder: "",
      defaultValue: ""
    },
    {
      label: "Author Email",
      name: "authorEmail",
      type: "email",
      placeholder: "user123@example.com",
      defaultValue: ""
    }
  ],
  "Data Hub": [
    {
      label: "Author",
      name: "author",
      type: "text",
      placeholder: "",
      defaultValue: ""
    },
    {
      label: "Author Email",
      name: "authorEmail",
      type: "email",
      placeholder: "user123@example.com",
      defaultValue: ""
    },
    {
      label: "ICT Group",
      name: "ictGroup",
      type: "select",
      placeholder: "Please select",
      options: [
        "Just Transitions",
        "peaCE",
        "Loop",
        "GG4GHG",
        "Cell Cultured Meat",
        "Activate",
        "CAT-G",
        "BENEFIT",
        "NDGP"
      ],
      defaultValue: ""
    }
  ]
};
