// eslint-disable-next-line import/no-unresolved -- uuid@13 "exports" not resolved by default import resolver
import { v4 as uuidv4 } from "uuid";
import { languageNameToAlpha3Codes } from "../../../constants/isoCodes";
import { LanguageConstants } from "../../../utils/languageUtils";
import {
  normalizeReferenceButtonTextMap,
  normalizeShowingAttribute
} from "./referenceQuestionUtils";

/*
 * Form builder pages use three parallel fields, and that’s intentional for now:
 *
 * - page.items — ordered list of what appears on the page (sections and top-level
 *   questions, interleaved). This is the list drag-and-drop reorders. Order here
 *   should match the form overlay’s attribute_order.
 *
 * - page.sections / page.questions — lookup tables keyed by id. Don’t use array
 *   index on these as “display order” for the page; use page.items for that.
 *
 * - Section contents: each section still has its own questions[] array. That order
 *   is the order of fields inside the section, not the same thing as page.items.
 *
 * Import walks the overlay’s attribute_order once and fills items in that exact
 * order so we don’t flatten layouts on load.
 */

const createQuestionFromAttribute = (
  attribute,
  interactionData,
  languages,
  threeLetterCodes,
  descriptions,
  attributeRowData,
  formatRuleRowData,
  savedEntryCodes,
  attributesWithLists,
  lanAttributeRowData,
  overlayLangCode
) => {
  if (!attribute) return null;

  const attributeInfo = attributeRowData.find((r) => r.Attribute === attribute);

  if (Array.isArray(attributeRowData) && attributeRowData.length > 0 && !attributeInfo) {
    console.warn(
      `[FormBuilder] Skipping form overlay reference to unknown attribute "${attribute}" ` +
        "— it is not present in the current schema's attribute list."
    );
    return null;
  }

  const attributeType = attributeInfo?.Type || interactionData?.type || "Text";

  const formatRule = formatRuleRowData.find((rule) => rule.Attribute === attribute);
  const formatText = formatRule?.FormatText || "";

  const titleObj = {};
  const placeholderObj = {};
  const descriptionObj = {};

  threeLetterCodes.forEach((langCode, index) => {
    const originalLang = languages[index];

    const labelData = lanAttributeRowData[originalLang]?.find(
      (item) => item.Attribute === attribute
    );

    const dataLangCode = langCode;

    if (labelData?.Label) {
      titleObj[originalLang] = labelData.Label;
    } else {
      titleObj[originalLang] = attribute;
    }

    if (interactionData?.placeholder) {
      if (
        typeof interactionData.placeholder === "object" &&
        interactionData.placeholder[dataLangCode]
      ) {
        placeholderObj[originalLang] = interactionData.placeholder[dataLangCode] || "";
      } else if (typeof interactionData.placeholder === "string") {
        placeholderObj[originalLang] = interactionData.placeholder;
      }
    }

    if (descriptions[dataLangCode]?.[attribute]) {
      descriptionObj[originalLang] = descriptions[dataLangCode][attribute];
    }
  });

  // Handle options/entry codes
  let options = [];
  if (attributesWithLists?.includes(attribute) && savedEntryCodes?.[attribute]) {
    const overlayLanguageName =
      languages.find(
        (lang) => languageNameToAlpha3Codes[lang.toLowerCase()] === overlayLangCode
      ) ||
      languages[0] ||
      LanguageConstants.DEFAULT_LANG_NAME;

    options = savedEntryCodes[attribute].map((entryCodeObj) => {
      const code = entryCodeObj.Code;
      const optionLabels = {};

      languages.forEach((lang) => {
        optionLabels[lang] = entryCodeObj[lang] || code || "";
      });

      return {
        id: uuidv4(),
        code,
        value: code,
        label:
          optionLabels[overlayLanguageName] ||
          optionLabels[languages[0] || LanguageConstants.DEFAULT_LANG_NAME] ||
          code,
        labels: optionLabels
      };
    });
  }

  // Handle boolean values
  let booleanValues = null;
  if (
    (attributeType === "Boolean" || attributeType === "Array[Boolean]") &&
    interactionData?.options
  ) {
    booleanValues = Array.isArray(interactionData.options)
      ? interactionData.options
      : [interactionData.options];
  }

  const question = {
    id: uuidv4(),
    attribute,
    title: titleObj,
    attributeType,
    ...(interactionData?.type && { interactionType: interactionData.type }),
    formatText,
    ...(Object.keys(placeholderObj).length > 0 && { placeholder: placeholderObj }),
    ...(Object.keys(descriptionObj).length > 0 && { description: descriptionObj }),
    ...(options.length > 0 && { options }),
    ...(booleanValues && { booleanValues }),
    ...(interactionData?.input_type && { inputType: interactionData.input_type }),
    ...(interactionData?.referenceButtonText && {
      referenceButtonText: interactionData.referenceButtonText
    }),
    ...(interactionData?.showingAttribute && {
      showingAttribute: interactionData.showingAttribute
    })
  };

  return question;
};

const processPageLabels = (
  pageId,
  pageLabels,
  sidebarLabels,
  descriptions,
  threeLetterCodes,
  languages,
  pageIndex
) => {
  const pageLabelsObj = {};
  const pageSidebarLabelsObj = {};
  const pageDescriptionsObj = {};

  threeLetterCodes.forEach((langCode, index) => {
    const originalLang = languages[index];

    // Use the current language code when looking up labels/descriptions
    const dataLangCode = langCode;

    pageLabelsObj[originalLang] =
      pageLabels[dataLangCode]?.[pageId] || `Page ${pageIndex + 1}`;

    pageSidebarLabelsObj[originalLang] =
      sidebarLabels[dataLangCode]?.[pageId] ||
      pageLabelsObj[originalLang] ||
      `Page ${pageIndex + 1}`;

    pageDescriptionsObj[originalLang] = descriptions[dataLangCode]?.[pageId] || "";
  });

  return { pageLabelsObj, pageSidebarLabelsObj, pageDescriptionsObj };
};

const processSectionLabels = (
  sectionId,
  pageLabels,
  descriptions,
  threeLetterCodes,
  languages,
  sectionIndex
) => {
  const sectionLabelsObj = {};
  const sectionDescriptionsObj = {};

  threeLetterCodes.forEach((langCode, index) => {
    const originalLang = languages[index];

    const dataLangCode = langCode;

    sectionLabelsObj[originalLang] =
      pageLabels[dataLangCode]?.[sectionId] || `Section ${sectionIndex + 1}`;

    sectionDescriptionsObj[originalLang] = descriptions[dataLangCode]?.[sectionId] || "";
  });

  return { sectionLabelsObj, sectionDescriptionsObj };
};

const convertOverlayToFormBuilder = (
  formOverlay,
  languages = ["English"],
  attributeRowData = [],
  formatRuleRowData = [],
  savedEntryCodes = {},
  attributesWithLists = [],
  lanAttributeRowData = {}
) => {
  if (!formOverlay) {
    return [];
  }

  // Convert language names to three-letter codes for the overlay structure
  const threeLetterCodes = languages.map((lang) => {
    if (lang.length === 3) return lang;
    return languageNameToAlpha3Codes[lang.toLowerCase()] || lang;
  });

  const overlayArray = Array.isArray(formOverlay) ? formOverlay : [formOverlay];

  const pageLabels = {};
  const sidebarLabels = {};
  const descriptions = {};
  let pagesStructure = [];
  let pageOrder = [];
  const interactionArgs = {};

  overlayArray.forEach((overlay) => {
    const overlayLang = overlay.language || "eng";

    if (overlay.page_labels) {
      pageLabels[overlayLang] = overlay.page_labels;
    }

    if (overlay.sidebar_label) {
      sidebarLabels[overlayLang] = overlay.sidebar_label;
    }

    if (overlay.description) {
      descriptions[overlayLang] = overlay.description;
    }

    if (pagesStructure.length === 0 && overlay.pages) {
      pagesStructure = overlay.pages;
    }
    if (pageOrder.length === 0 && overlay.page_order) {
      pageOrder = overlay.page_order;
    }

    if (overlay.interaction?.[0]?.arguments) {
      if (!interactionArgs[overlayLang]) {
        interactionArgs[overlayLang] = {};
      }
      Object.assign(interactionArgs[overlayLang], overlay.interaction[0].arguments);
    }
  });

  const overlayLangCode =
    overlayArray.find((overlay) => threeLetterCodes.includes(overlay.language))
      ?.language ||
    threeLetterCodes[0] ||
    overlayArray[0]?.language ||
    Object.keys(pageLabels)[0] ||
    Object.keys(descriptions)[0] ||
    "eng";

  const getInteractionData = (attribute) => {
    const langCodes = Object.keys(interactionArgs || {});
    if (langCodes.length === 0) return null;

    let merged = null;
    const placeholderObj = {};
    const descriptionObj = {};
    const referenceButtonTextObj = {};
    let showingAttribute = [];

    langCodes.forEach((langCode) => {
      const data = interactionArgs[langCode]?.[attribute];
      if (!data) return;

      if (!merged) {
        const {
          placeholder,
          description,
          reference_button_text,
          showing_attribute,
          ...rest
        } = data;
        merged = { ...rest };
      }

      // Collect placeholder values keyed by overlay language code
      if (data.placeholder !== undefined) {
        if (typeof data.placeholder === "object" && data.placeholder !== null) {
          Object.assign(placeholderObj, data.placeholder);
        } else {
          placeholderObj[langCode] = data.placeholder;
        }
      }

      // Collect description values keyed by overlay language code
      if (data.description !== undefined) {
        if (typeof data.description === "object" && data.description !== null) {
          Object.assign(descriptionObj, data.description);
        } else {
          descriptionObj[langCode] = data.description;
        }
      }

      if (data.reference_button_text !== undefined) {
        const originalLang = languages[threeLetterCodes.indexOf(langCode)] || langCode;
        const normalizedMap = normalizeReferenceButtonTextMap(
          data.reference_button_text,
          [originalLang]
        );
        const mappedValue =
          normalizedMap[originalLang] ||
          normalizedMap[langCode] ||
          normalizedMap.default ||
          "";
        if (mappedValue) {
          referenceButtonTextObj[originalLang] = mappedValue;
        }
      }

      if (showingAttribute.length === 0 && data.showing_attribute !== undefined) {
        showingAttribute = normalizeShowingAttribute(data.showing_attribute);
      }
    });

    if (Object.keys(placeholderObj).length > 0) {
      merged.placeholder = placeholderObj;
    }
    if (Object.keys(descriptionObj).length > 0) {
      merged.description = descriptionObj;
    }
    if (Object.keys(referenceButtonTextObj).length > 0) {
      merged.referenceButtonText = referenceButtonTextObj;
    }
    if (showingAttribute.length > 0) {
      merged.showingAttribute = showingAttribute;
    }

    return merged;
  };

  const pageMap = {};
  pagesStructure.forEach((pageStruct) => {
    pageMap[pageStruct.named_section] = pageStruct;
  });

  const formBuilderPages = [];

  const orderedPageIds = pageOrder.length > 0 ? pageOrder : Object.keys(pageMap);

  orderedPageIds.forEach((pageId, pageIndex) => {
    const pageStruct = pageMap[pageId];
    if (!pageStruct) return;

    const { pageLabelsObj, pageSidebarLabelsObj, pageDescriptionsObj } =
      processPageLabels(
        pageId,
        pageLabels,
        sidebarLabels,
        descriptions,
        threeLetterCodes,
        languages,
        pageIndex
      );

    const page = {
      id: pageId || uuidv4(),
      labels: pageLabelsObj,
      sidebarLabels: pageSidebarLabelsObj,
      descriptions: pageDescriptionsObj,
      questions: [],
      sections: [],
      items: []
    };

    const attributeOrder = pageStruct.attribute_order || [];

    // Walk overlay attribute_order once and populate both `sections` /
    // `questions` as keyed buckets and `items` as the authoritative mixed
    // ordering (mirror of overlay JSON order). Previously all sections were
    // appended before questions in `items`, destroying interleaved layouts.
    const sections = [];
    const directQuestionObjects = [];
    const items = [];

    attributeOrder.forEach((item) => {
      if (typeof item === "string") {
        const question = createQuestionFromAttribute(
          item,
          getInteractionData(item),
          languages,
          threeLetterCodes,
          descriptions,
          attributeRowData,
          formatRuleRowData,
          savedEntryCodes,
          attributesWithLists,
          lanAttributeRowData,
          overlayLangCode
        );
        if (!question) return;
        directQuestionObjects.push(question);
        items.push({ kind: "question", id: question.id });
      } else if (item && typeof item === "object" && item.named_section) {
        const sectionId = item.named_section;
        const sectionAttributes = item.attribute_order || [];

        const { sectionLabelsObj, sectionDescriptionsObj } = processSectionLabels(
          sectionId,
          pageLabels,
          descriptions,
          threeLetterCodes,
          languages,
          sections.length
        );

        const sectionQuestions = sectionAttributes
          .filter((attr) => attr && typeof attr === "string")
          .map((attribute) =>
            createQuestionFromAttribute(
              attribute,
              getInteractionData(attribute),
              languages,
              threeLetterCodes,
              descriptions,
              attributeRowData,
              formatRuleRowData,
              savedEntryCodes,
              attributesWithLists,
              lanAttributeRowData,
              overlayLangCode
            )
          )
          .filter(Boolean);

        // Skip empty sections entirely so `items` never references a missing section.
        if (sectionQuestions.length === 0) return;

        const sectionObj = {
          id: sectionId || uuidv4(),
          labels: sectionLabelsObj,
          descriptions: sectionDescriptionsObj,
          questions: sectionQuestions
        };
        sections.push(sectionObj);
        items.push({ kind: "section", id: sectionObj.id });
      }
    });

    page.questions = directQuestionObjects;
    page.sections = sections;
    page.items = items;

    formBuilderPages.push(page);
  });

  return formBuilderPages;
};

export default convertOverlayToFormBuilder;
