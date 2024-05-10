![Screenshot 2024-05-10 at 11 54 18 AM](https://github.com/agrifooddatacanada/OCA_Composer/assets/136002781/88f15143-3c3c-4c63-9137-a388cef96eaf)

<h1 style="text-align: center; color: #94002a;">Attribute Details</h1>

On the attribute details page, you can edit properties of each attribute present in your schema.

## Attribute Name

You can edit each attribute name and reorder the attributes.

## Sensitive

Sensitive attributes are where you can specify Sensitive Attribute for sensitive data (e.g., names of people, government identification, birth date, etc.). Marking an entry with a check will allow you to flag any attributes where identifying information about entities may be captured.

- Flagging an attribute acts as an alert to data users to treat the data as high-risk throughout the data lifecycle and encrypted or removed at any stage.
- For help evaluating which attributes can be sensitive, you can read advice in the <a href="https://docs.kantarainitiative.org/Blinding-Identity-Taxonomy-Report-Version-1.0.html" style="color: #94002a;">Blinding Identity Taxonomy</a> report by the Kantara Initiative.

## Unit

Units are where you can describe the units for each attribute if needed.

## Type

- Text: text, from single-letter entries to fields of unstructured text
- Numeric: numbers
- Boolean: a data type where the data only has two possible variables: true or false
- Binary: a data type that defines a binary code signal
- DateTime: a data type that defines dates. Common formats include dates (e.g., YYYY-MM-DD), times (e.g., hh:mm:ss), dates and times concatenated (e.g., YYYY-MM-DDThh:mm:ss.sss+zz:zz), and durations (e.g., PnYnMnD)
- Array [attribute type]: a data type that defines a structure that holds several data items or elements of the same data type

## List

A list is a very useful feature that allows the schema author to limit the data that can be entered for a specific attribute. Select this option if you would like to create a list of acceptable entries that the user will be able to select from.

If the user is able to select only one valid entry from the list (e.g., a list where the user will select the sample location), your data Type will be something suitable like "Text" or "Numeric". If you will allow multi-selection from the list (e.g., a list where the user can select all that apply), then your data Type is an Array.

<iframe width="560" height="315" src="https://www.youtube.com/embed/T-Uzr3p41SM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<br>

---

<div style="display: flex; flex-direction: column; align-items: flex-end;">
  <img src="https://github.com/agrifooddatacanada/OCA_Composer/assets/136002781/75d5efa5-15e9-4e24-abb2-1aac5a47857c" alt="agri-logo" style="height: 80px;width: 200px;">
</div>
