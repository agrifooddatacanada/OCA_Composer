export const CATALOGUE_INFO_KEY = "catalogueInfo";
export const catalogueScenarios = ["General", "Data Hub"];

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
      options: ["group 1", "group 2", "group 3"],
      defaultValue: ""
    }
  ]
};
