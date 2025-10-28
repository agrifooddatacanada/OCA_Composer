import { languageNameToAlpha3Codes } from "../../../constants/isoCodes";

const getQuestionTypeInfo = (attributeType) => {
  const type = attributeType || "";
  return {
    attributeType: type,
    isBooleanType: type === "Boolean" || type === "Array[Boolean]",
    isTextType: type === "Text" || type === "Array[Text]",
    isNumericType: type === "Numeric" || type === "Array[Numeric]",
    isDateTimeType: type === "DateTime" || type === "Array[DateTime]"
  };
};

const processPlaceholder = (question, threeLetterCodes, languages) => {
  const placeholderObj = {};
  const { isTextType, isNumericType, isDateTimeType } = getQuestionTypeInfo(
    question.attributeType || question.type
  );
  const supportsPlaceholder = isTextType || isNumericType || isDateTimeType;

  if (supportsPlaceholder) {
    threeLetterCodes.forEach((lang, index) => {
      const originalLang = languages[index];
      if (typeof question.placeholder === "object" && question.placeholder !== null) {
        placeholderObj[lang] = question.placeholder[originalLang] || "";
      } else {
        placeholderObj[lang] = question.placeholder || "";
      }
    });
  }

  return { placeholderObj, supportsPlaceholder };
};

const processQuestionForInteraction = (question, threeLetterCodes, languages) => {
  const { attributeType, isBooleanType } = getQuestionTypeInfo(
    question.attributeType || question.type
  );
  const { placeholderObj, supportsPlaceholder } = processPlaceholder(
    question,
    threeLetterCodes,
    languages
  );
  const booleanOptions = isBooleanType
    ? question.booleanValues || ["True", "False"]
    : null;
  const hasOptions =
    question.options && Array.isArray(question.options) && question.options.length > 0;

  return {
    type: attributeType,
    ...(supportsPlaceholder &&
      Object.keys(placeholderObj).length > 0 && { placeholder: placeholderObj }),
    ...(booleanOptions && { options: booleanOptions }),
    ...(hasOptions && question.inputType && { input_type: question.inputType })
  };
};

export const convertToFormInformation = (pages) => {
  const formData = [];
  (pages || []).forEach((page) => {
    const collect = (q) => {
      if (!q?.attribute) return;
      const hasOptions = q.options && Array.isArray(q.options) && q.options.length > 0;
      formData.push({
        Attribute: q.attribute,
        Label: q.title || q.attribute,
        Placeholder: q.placeholder || "",
        Type: q.type,
        Required: q.required || false,
        Options: q.options || [],
        ...(hasOptions && q.inputType && { InputType: q.inputType })
      });
    };
    (page.questions || []).forEach(collect);
    (page.sections || []).forEach((s) => (s.questions || []).forEach(collect));
  });
  return formData;
};

export const convertToFormInformationOverlay = (
  pages,
  languages = ["English"],
  schemaName = {}
) => {
  const pagesStructure = [];
  const pageOrder = [];
  const pageLabels = {};
  const sidebarLabel = {};
  const description = {};
  const title = {};
  const interaction = [{ arguments: {} }];

  // Convert language names to three-letter codes for the overlay structure
  const threeLetterCodes = languages.map((lang) => {
    if (lang.length === 3) return lang;
    return languageNameToAlpha3Codes[lang.toLowerCase()] || lang;
  });

  threeLetterCodes.forEach((lang) => {
    pageLabels[lang] = {};
    sidebarLabel[lang] = {};
    description[lang] = {};
    title[lang] = schemaName[lang] || "";
  });

  pages.forEach((page, pageIdx) => {
    const pageId = page.id || `page-${pageIdx + 1}`;
    pageOrder.push(pageId);

    threeLetterCodes.forEach((lang, index) => {
      const originalLang = languages[index];
      pageLabels[lang][pageId] = page.labels?.[originalLang] || `Page ${pageIdx + 1}`;
      sidebarLabel[lang][pageId] =
        page.sidebarLabels?.[originalLang] || `Page ${pageIdx + 1}`;
      description[lang][pageId] =
        page.descriptions?.[originalLang] || `Page ${pageIdx + 1}`;
    });

    const pageStructure = {
      named_section: pageId,
      attribute_order: []
    };

    (page.sections || []).forEach((section, sectionIdx) => {
      const sectionId = section.id || `section-${sectionIdx + 1}`;
      const sectionQuestions = (section.questions || [])
        .map((q) => q.attribute)
        .filter(Boolean);

      if (sectionQuestions.length > 0) {
        pageStructure.attribute_order.push({
          named_section: sectionId,
          attribute_order: sectionQuestions
        });

        threeLetterCodes.forEach((lang, index) => {
          const originalLang = languages[index];
          pageLabels[lang][sectionId] =
            section.labels?.[originalLang] || `Section ${sectionIdx + 1}`;
          description[lang][sectionId] =
            section.descriptions?.[originalLang] || `Section ${sectionIdx + 1}`;
        });

        section.questions.forEach((q) => {
          if (q?.attribute) {
            interaction[0].arguments[q.attribute] = processQuestionForInteraction(
              q,
              threeLetterCodes,
              languages
            );
          }
        });
      }
    });

    // Process direct page questions (not in sections)
    const directQuestions = (page.questions || [])
      .filter((q) => !q.sectionId)
      .map((q) => q.attribute)
      .filter(Boolean);

    if (directQuestions.length > 0) {
      pageStructure.attribute_order.push(...directQuestions);

      page.questions.forEach((q) => {
        if (q?.attribute && !q.sectionId) {
          interaction[0].arguments[q.attribute] = processQuestionForInteraction(
            q,
            threeLetterCodes,
            languages
          );
        }
      });
    }

    pagesStructure.push(pageStructure);
  });

  return {
    pages: pagesStructure,
    page_order: pageOrder,
    page_labels: pageLabels,
    sidebar_label: sidebarLabel,
    description,
    interaction,
    title
  };
};
