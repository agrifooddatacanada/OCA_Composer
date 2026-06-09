import { langCodeOCAFromName } from "../../../utils/languageUtils";
import {
  isReferenceQuestion,
  normalizeReferenceButtonTextMap,
  normalizeShowingAttribute
} from "./referenceQuestionUtils";

/*
 * When turning form builder state back into an OCA form overlay, the walk that
 * builds attribute_order should follow page.items. That’s the structure the UI
 * actually mutates.
 *
 * page.sections and page.questions are only there to resolve ids from items into
 * full objects (and to emit nested sections). Treat them as maps keyed by id,
 * not as ordered lists for the page.
 *
 * If items is missing or empty (old saved state), we fall back to “all sections
 * then all top-level questions” so exports don’t come out blank. New imports
 * should always populate items.
 */

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

const isQuestionLikeItemKind = (kind) =>
  kind === "question" || kind === "reference" || kind === "childSchema";

const resolvePageItems = (page) => {
  if (!page) return [];
  if (Array.isArray(page.items) && page.items.length > 0) return page.items;
  return [
    ...(page.sections || []).map((s) => ({ kind: "section", id: s.id })),
    ...(page.questions || [])
      .filter((q) => !q.sectionId)
      .map((q) => ({ kind: "question", id: q.id }))
  ];
};

/**
 * Visit every question on a page in canonical UI / overlay order.
 * onQuestion receives (question, { section: object | null }).
 *
 * This is the single source of truth for "what order are questions in on a
 * page" — convertToFormInformation, buildFormOverlayInteraction, and the
 * overlay export all go through here so row order, interaction key order, and
 * attribute_order can never drift apart.
 */
const walkPageQuestions = (page, onQuestion) => {
  if (!page) return;
  const sectionById = new Map((page.sections || []).map((s) => [s.id, s]));
  const questionById = new Map((page.questions || []).map((q) => [q.id, q]));

  resolvePageItems(page).forEach((it) => {
    if (it.kind === "section") {
      const section = sectionById.get(it.id);
      if (!section) return;
      (section.questions || []).forEach((q) => {
        if (q?.attribute) onQuestion(q, { section });
      });
    } else if (isQuestionLikeItemKind(it.kind)) {
      const q = questionById.get(it.id);
      if (!q?.attribute || q.sectionId) return;
      onQuestion(q, { section: null });
    }
  });
};

const walkAllPagesQuestions = (pages, onQuestion) => {
  (pages || []).forEach((page) => walkPageQuestions(page, onQuestion));
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

const processDescription = (question, threeLetterCodes, languages) => {
  const descriptionObj = {};

  threeLetterCodes.forEach((langCode, index) => {
    const originalLang = languages[index];

    if (typeof question.description === "object" && question.description !== null) {
      descriptionObj[langCode] = question.description[originalLang] || "";
    } else {
      descriptionObj[langCode] = question.description || "";
    }
  });

  const hasDescription = Object.values(descriptionObj).some(
    (desc) => desc && typeof desc === "string" && desc.trim().length > 0
  );

  return { descriptionObj, hasDescription };
};

const processQuestionForInteraction = (
  question,
  threeLetterCodes,
  languages,
  options
) => {
  const { referenceLangIndex } = options;
  const { attributeType, isBooleanType } = getQuestionTypeInfo(
    question.attributeType || question.type
  );
  const isReferenceQuestionField = isReferenceQuestion(question);
  const { placeholderObj, supportsPlaceholder } = processPlaceholder(
    question,
    threeLetterCodes,
    languages
  );
  const { descriptionObj, hasDescription } = processDescription(
    question,
    threeLetterCodes,
    languages
  );
  const booleanOptions = isBooleanType
    ? question.booleanValues || ["True", "False"]
    : null;
  const hasOptions =
    question.options && Array.isArray(question.options) && question.options.length > 0;
  const referenceButtonTextMap = normalizeReferenceButtonTextMap(
    question.referenceButtonText || question.reference_button_text,
    languages
  );

  let referenceButtonTextForOverlay = "";
  if (
    isReferenceQuestionField &&
    typeof referenceLangIndex === "number" &&
    languages[referenceLangIndex] !== undefined
  ) {
    const langName = languages[referenceLangIndex];
    const raw = referenceButtonTextMap[langName];
    if (typeof raw === "string" && raw.trim()) {
      referenceButtonTextForOverlay = raw.trim();
    }
  }

  const showingAttribute = normalizeShowingAttribute(
    question.showingAttribute || question.showing_attribute
  );

  return {
    type: isReferenceQuestionField ? "reference" : attributeType,
    ...(supportsPlaceholder &&
      Object.keys(placeholderObj).length > 0 && { placeholder: placeholderObj }),
    ...(hasDescription && { description: descriptionObj }),
    ...(booleanOptions && { options: booleanOptions }),
    ...(hasOptions && question.inputType && { input_type: question.inputType }),
    ...(isReferenceQuestionField &&
      referenceButtonTextForOverlay && {
        reference_button_text: referenceButtonTextForOverlay
      }),
    ...(isReferenceQuestionField &&
      showingAttribute.length > 0 && {
        showing_attribute: showingAttribute
      })
  };
};

const addQuestionDescriptionToObject = (
  question,
  description,
  threeLetterCodes,
  languages
) => {
  if (!question?.attribute) return;

  threeLetterCodes.forEach((langCode, index) => {
    const originalLang = languages[index];
    const questionDesc = question.description?.[originalLang];

    if (
      questionDesc &&
      typeof questionDesc === "string" &&
      questionDesc.trim().length > 0
    ) {
      if (!description[langCode][question.attribute]) {
        description[langCode][question.attribute] = questionDesc;
      }
    }
  });
};

export const buildFormOverlayInteraction = (pages, languages, langIndex) => {
  const threeLetterCodes = languages.map((lang) => {
    if (lang.length === 3) return lang;
    return langCodeOCAFromName(lang);
  });

  const argumentsObj = {};
  walkAllPagesQuestions(pages, (q) => {
    argumentsObj[q.attribute] = processQuestionForInteraction(
      q,
      threeLetterCodes,
      languages,
      {
        referenceLangIndex: langIndex
      }
    );
  });

  return [{ arguments: argumentsObj }];
};

export const convertToFormInformation = (pages) => {
  const formData = [];
  walkAllPagesQuestions(pages, (q) => {
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

  const threeLetterCodes = languages.map((lang) => {
    if (lang.length === 3) return lang;
    return langCodeOCAFromName(lang);
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

    const sectionById = new Map((page.sections || []).map((s) => [s.id, s]));
    const questionById = new Map((page.questions || []).map((q) => [q.id, q]));

    const itemsInOrder = resolvePageItems(page);

    let sectionSeenCount = 0;

    itemsInOrder.forEach((it) => {
      if (it.kind === "section") {
        const section = sectionById.get(it.id);
        if (!section) return;

        const sectionId = section.id || `section-${sectionSeenCount + 1}`;
        const sectionQuestions = (section.questions || [])
          .map((q) => q.attribute)
          .filter(Boolean);

        if (sectionQuestions.length === 0) {
          sectionSeenCount += 1;
          return;
        }

        pageStructure.attribute_order.push({
          named_section: sectionId,
          attribute_order: sectionQuestions
        });

        threeLetterCodes.forEach((lang, index) => {
          const originalLang = languages[index];
          pageLabels[lang][sectionId] =
            section.labels?.[originalLang] || `Section ${sectionSeenCount + 1}`;
          description[lang][sectionId] =
            section.descriptions?.[originalLang] || `Section ${sectionSeenCount + 1}`;
        });

        section.questions.forEach((q) => {
          if (q?.attribute) {
            addQuestionDescriptionToObject(q, description, threeLetterCodes, languages);
          }
        });

        sectionSeenCount += 1;
      } else if (isQuestionLikeItemKind(it.kind)) {
        const q = questionById.get(it.id);
        if (!q?.attribute || q.sectionId) return;

        pageStructure.attribute_order.push(q.attribute);
        addQuestionDescriptionToObject(q, description, threeLetterCodes, languages);
      }
    });

    pagesStructure.push(pageStructure);
  });

  return {
    pages: pagesStructure,
    page_order: pageOrder,
    page_labels: pageLabels,
    sidebar_label: sidebarLabel,
    description,
    title
  };
};
