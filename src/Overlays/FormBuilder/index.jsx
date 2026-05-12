import React, { useCallback, useContext, useState, useEffect, useMemo, useRef } from "react";
import { Context } from "../../App";
import { useMultiSchema } from "../../schema/schemaContext";
import BackNextSkeleton from "../../components/BackNextSkeleton";
import { BETWEEN_SECTION_SPACING } from "../../constants/constants";
import { Box, Button, Typography, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { CustomPalette } from "../../constants/customPalette";
import { Add as AddIcon } from "@mui/icons-material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import { langNameFromTwoLetters, LanguageConstants } from "../../utils/languageUtils";
import i18next from "i18next";
import usePrimaryColor from "../../hooks/usePrimaryColor";
import { isChildSchemaType } from "../../constants/constants";

import AttributePalette from "./AttributePalette";
import DroppablePage from "./DroppablePage";
import QuestionEditorDialog from "./dialogs/QuestionEditorDialog";
import SectionEditorDialog from "./dialogs/SectionEditorDialog";
import PageEditorDialog from "./dialogs/PageEditorDialog";
import { useUsedAttributes } from "./hooks/useUsedAttributes";
import { convertToFormInformation } from "./utils/convertToFormInformation";
import { moveQuestionToPage, moveQuestionToSection, moveSectionBetweenPages, reorderQuestionInContainer, reorderPages, reorderPageItems, movePageItemToPage } from "./utils/moves";

const FormBuilder = () => {
  const { t } = useTranslation();
  const primaryColor = usePrimaryColor();
  const {
    setCurrentPage,
    setSelectedOverlay
  } = useContext(Context);

  const {
    getSchema,
    getCurrentSchemaId,
    updateSchema,
    getAttributesList,
    getFormatRuleData,
    schemaStates
  } = useMultiSchema();
  const schemaState = getSchema();
  const currentSchemaId = getCurrentSchemaId();
  
  const languages = schemaState?.metadata?.languages || [LanguageConstants.DEFAULT_LANG_NAME];
  const savedEntryCodes = schemaState?.entryCodes || {};
  const attributesWithLists = schemaState?.attributesWithLists || [];
  
  const attributesList = getAttributesList();
  const formatRuleRowData = getFormatRuleData();
  const attributeRowData = schemaState?.attributes || [];
  const lanAttributeRowData = schemaState?.lanAttributeRowData || {};
  const FormInformationRowData = schemaState?.FormInformationRowData || [];
  const formBuilderPages = schemaState?.formBuilderPages || [];
  const filteredLanguages = useMemo(() => [...languages], [languages]);
  const [currentLanguage, setCurrentLanguage] = useState(
    filteredLanguages[0] || LanguageConstants.DEFAULT_LANG_NAME
  );

  useEffect(() => {
    if (!languages.includes(currentLanguage)) {
      setCurrentLanguage(filteredLanguages[0] || LanguageConstants.DEFAULT_LANG_NAME);
    }
  }, [languages, currentLanguage, filteredLanguages]);

  // Update currentLanguage when global UI language changes
  useEffect(() => {
    const userLanguage = langNameFromTwoLetters(i18next.language);
    if (userLanguage && languages.includes(userLanguage)) {
      setCurrentLanguage(userLanguage);
    }
  }, [i18next.language, languages]);

  const initializePageLabels = (pageNumber, langs) => {
    const defaultLabel = `Page ${pageNumber}`;
    const labels = {};
    const sidebarLabels = {};
    const descriptions = {};
    langs.forEach(lang => {
      labels[lang] = defaultLabel;
      sidebarLabels[lang] = defaultLabel;
      descriptions[lang] = defaultLabel;
    });
    return { labels, sidebarLabels, descriptions };
  };

  const initializeSectionLabels = (sectionNumber, langs) => {
    const defaultLabel = `Section ${sectionNumber}`;
    const labels = {};
    const descriptions = {};
    langs.forEach(lang => {
      labels[lang] = defaultLabel;
      descriptions[lang] = defaultLabel;
    });
    return { labels, descriptions };
  };

  const ensurePageItems = (page) => {
    if (page.items && Array.isArray(page.items) && page.items.length > 0) {
      return page;
    }
    const sectionItems = (page.sections || []).map(s => ({ kind: 'section', id: s.id }));
    const questionItems = (page.questions || []).filter(q => !q.sectionId).map(q => ({ kind: 'question', id: q.id }));
    return { ...page, items: [...sectionItems, ...questionItems] };
  };

  const [pages, setPages] = useState(() => {
    if (formBuilderPages && formBuilderPages.length > 0) {
      return formBuilderPages.map(ensurePageItems);
    }
    return [
      { id: uuidv4(), ...initializePageLabels(1, languages), questions: [], sections: [], items: [] }
    ];
  });
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [showPageDialog, setShowPageDialog] = useState(false);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);
  const [editingPageIndex, setEditingPageIndex] = useState(-1);
  const [editingPage, setEditingPage] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editingSectionIndex, setEditingSectionIndex] = useState(-1);
  const [targetPageIndex, setTargetPageIndex] = useState(-1);
  const [targetSectionIndex, setTargetSectionIndex] = useState(null);

  const isUpdatingFromFormBuilder = useRef(false);
  const lastSyncedSchemaIdRef = useRef(currentSchemaId);

  // Re-seed pages from the new schema's formBuilderPages whenever currentSchemaId changes.
  useEffect(() => {
    if (lastSyncedSchemaIdRef.current === currentSchemaId) return;
    lastSyncedSchemaIdRef.current = currentSchemaId;
    if (formBuilderPages && formBuilderPages.length > 0) {
      setPages(formBuilderPages.map(ensurePageItems));
    } else {
      setPages([
        { id: uuidv4(), ...initializePageLabels(1, languages), questions: [], sections: [], items: [] }
      ]);
    }
    // languages / formBuilderPages intentionally not in deps: this effect is
    // strictly a schema-switch hook, not a "keep pages mirrored to schemaState"
    // loop (applyPages owns that direction).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSchemaId]);

  // Mutates local layout AND mirrors it into global schemaState in the same
  // tick.
  const applyPages = useCallback((updaterOrValue) => {
    setPages((prev) => {
      const next =
        typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
      updateSchema({ formBuilderPages: next });
      return next;
    });
  }, [updateSchema]);

  const usedAttributes = useUsedAttributes(pages);
  const childAttributeOptionsByParent = useMemo(() => {
    const schemaEntries = Object.entries(schemaStates || {});
    const schemaIdsByMetadataName = schemaEntries.reduce((acc, [schemaId, state]) => {
      const name = state?.metadata?.name;
      if (!name) return acc;
      if (!acc[name]) acc[name] = [];
      acc[name].push(schemaId);
      return acc;
    }, {});

    const getSchemaById = (schemaId) => {
      if (!schemaId) return null;
      return schemaStates?.[schemaId] || null;
    };

    const getSchemaByUniqueMetadataName = (name, parentAttribute) => {
      if (!name) return null;
      const ids = schemaIdsByMetadataName[name] || [];
      if (ids.length === 1) {
        return schemaStates?.[ids[0]] || null;
      }
      if (ids.length > 1) {
        console.warn(
          "[FormBuilder] Ambiguous child schema metadata.name match for reference preview.",
          { parentAttribute, metadataName: name, candidateSchemaIds: ids }
        );
      }
      return null;
    };

    const extractReferencedSchemaId = (originalType) => {
      if (typeof originalType !== "string") return "";
      const trimmed = originalType.trim();
      if (trimmed.startsWith("refs:") || trimmed.startsWith("refn:")) {
        return trimmed.split(":").slice(1).join(":").trim();
      }
      const arrayMatch = trimmed.match(/^Array\[(refs|refn):(.+)\]$/i);
      return arrayMatch?.[2]?.trim() || "";
    };

    const result = {};
    (attributeRowData || []).forEach((attr) => {
      const originalType = attr?.OriginalType;
      const parentAttribute = attr?.Attribute;
      const type = attr?.Type;
      if (!parentAttribute) return;

      const isReferenceByOriginalType =
        typeof originalType === "string" &&
        (originalType.trim().startsWith("refs:") ||
          originalType.trim().startsWith("refn:") ||
          /^Array\[(refs|refn):.+\]$/i.test(originalType.trim()));

      if (!isReferenceByOriginalType && !isChildSchemaType(type)) {
        return;
      }

      const referencedSchemaId = extractReferencedSchemaId(originalType);
      const childSchemaState =
        getSchemaById(referencedSchemaId) ||
        getSchemaById(parentAttribute) ||
        getSchemaByUniqueMetadataName(parentAttribute, parentAttribute);
      const childKeys = (childSchemaState?.attributes || [])
        .map((childAttr) => childAttr?.Attribute)
        .filter(Boolean);

      result[parentAttribute] = childKeys;
    });
    return result;
  }, [attributeRowData, schemaStates]);

  useEffect(() => {
    if (!pages || pages.length === 0) return;
    if (isUpdatingFromFormBuilder.current) {
      isUpdatingFromFormBuilder.current = false;
      return;
    }

    const equalLangMap = (a, b, langs) => {
      if (a === b) return true;
      const aObj = a && typeof a === 'object';
      const bObj = b && typeof b === 'object';
      if (!aObj && !bObj) return (a || '') === (b || '');
      if (!aObj || !bObj) return false;
      for (const lang of langs) {
        if ((a[lang] || '') !== (b[lang] || '')) return false;
      }
      return true;
    };

    const equalOptions = (a, b, langs) => {
      if (a === b) return true;
      if (!Array.isArray(a) || !Array.isArray(b)) return false;
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        const ao = a[i] || {};
        const bo = b[i] || {};
        if (ao.code !== bo.code || ao.value !== bo.value || ao.label !== bo.label) return false;
        if (!equalLangMap(ao.labels, bo.labels, langs)) return false;
      }
      return true;
    };

    const syncQuestionData = (question) => {
      const { attribute } = question;
      if (!attribute) return question;

      const attributeInfo = attributeRowData.find((r) => r.Attribute === attribute);
      const formatRule = formatRuleRowData.find((rule) => rule.Attribute === attribute);
      const attributeType = attributeInfo?.Type || question.attributeType;
      const formatText = formatRule?.FormatText || '';

      const updatedTitle = {};
      const updatedPlaceholder = {};
      const updatedDescription = {};
      languages.forEach(lang => {
        const langData = lanAttributeRowData?.[lang]?.find(item => item.Attribute === attribute);
        updatedTitle[lang] = langData?.Label || question.title?.[lang] || attribute;
        updatedPlaceholder[lang] = langData?.Placeholder || question.placeholder?.[lang] || '';
        updatedDescription[lang] = langData?.Description || question.description?.[lang] || '';
      });

      let updatedOptions = question.options || [];
      if (attributesWithLists?.includes(attribute) && savedEntryCodes?.[attribute]) {
        updatedOptions = savedEntryCodes[attribute].map((entryCode) => {
          const optionLabels = {};
          languages.forEach(lang => {
            optionLabels[lang] = entryCode[lang] || entryCode.Code;
          });
          const existingOption = question.options?.find(opt => opt.code === entryCode.Code);
          return {
            id: existingOption?.id || uuidv4(),
            code: entryCode.Code,
            value: entryCode.Code,
            label: optionLabels[languages[0] || LanguageConstants.DEFAULT_LANG_NAME] || entryCode.Code,
            labels: optionLabels
          };
        });
      }

      // Identity short-circuit: when every synced field equals what the
      // question already had, return the same reference so the caller can
      // detect "no change" with `===` instead of a JSON.stringify of the
      // entire page tree.
      if (
        equalLangMap(question.title, updatedTitle, languages) &&
        equalLangMap(question.placeholder, updatedPlaceholder, languages) &&
        equalLangMap(question.description, updatedDescription, languages) &&
        (question.formatText || '') === formatText &&
        question.attributeType === attributeType &&
        equalOptions(question.options, updatedOptions, languages)
      ) {
        return question;
      }

      return {
        ...question,
        title: updatedTitle,
        placeholder: updatedPlaceholder,
        description: updatedDescription,
        formatText,
        attributeType,
        options: updatedOptions
      };
    };

    const syncSection = (section) => {
      const prevQs = section.questions || [];
      const nextQs = prevQs.map(syncQuestionData);
      const changed = nextQs.some((q, i) => q !== prevQs[i]);
      return changed ? { ...section, questions: nextQs } : section;
    };

    const syncPageData = (page) => {
      const prevQs = page.questions || [];
      const prevSecs = page.sections || [];
      const nextQs = prevQs.map(syncQuestionData);
      const nextSecs = prevSecs.map(syncSection);
      const questionsChanged = nextQs.some((q, i) => q !== prevQs[i]);
      const sectionsChanged = nextSecs.some((s, i) => s !== prevSecs[i]);
      if (!questionsChanged && !sectionsChanged) return page;
      return { ...page, questions: nextQs, sections: nextSecs };
    };

    const syncedPages = pages.map(syncPageData);
    const hasChanges = syncedPages.some((p, i) => p !== pages[i]);
    if (hasChanges) {
      applyPages(syncedPages);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanAttributeRowData, formatRuleRowData, attributeRowData, savedEntryCodes, attributesWithLists, languages]);

  const handleAddPage = () => {
    const pageNumber = pages.length + 1;
    const newPage = { id: uuidv4(), ...initializePageLabels(pageNumber, languages), questions: [], sections: [], items: [] };
    applyPages(prev => [...prev, newPage]);
  };

  const handleAddSection = (pageIndex) => {
    const sectionNumber = (pages[pageIndex].sections?.length || 0) + 1;
    const newSection = { id: uuidv4(), ...initializeSectionLabels(sectionNumber, languages), questions: [] };
    applyPages(prev => prev.map((p, i) => i === pageIndex ? { ...p, sections: [...(p.sections || []), newSection], items: [ ...(p.items || []), { kind: 'section', id: newSection.id } ] } : p));
  };

  const handleEditPage = (page, pageIndex) => { setEditingPage(page); setEditingPageIndex(pageIndex); setShowPageDialog(true); };
  const handleDeletePage = (pageIndex) => { if (pages.length > 1) applyPages(prev => prev.filter((_, i) => i !== pageIndex)); };
  const handleSavePage = (pageData) => { applyPages(prev => prev.map((p, i) => i === editingPageIndex ? { ...p, ...pageData } : p)); };

  const handleEditSection = (section, sectionIndex, pageIndex) => { setEditingSection(section); setEditingSectionIndex(sectionIndex); setTargetPageIndex(pageIndex); setShowSectionDialog(true); };
  const handleDeleteSection = (sectionIndex, pageIndex) => {
    applyPages(prev => prev.map((p, i) => {
      if (i !== pageIndex) return p;
      const section = p.sections[sectionIndex];
      const newSections = (p.sections || []).filter((_, s) => s !== sectionIndex);
      const newItems = (p.items || []).filter(it => !(it.kind === 'section' && it.id === section.id));
      return { ...p, sections: newSections, items: newItems };
    }));
  };
  const handleSaveSection = (sectionData) => {
    applyPages(prev => prev.map((p, i) => i === targetPageIndex ? { ...p, sections: p.sections.map((s, si) => si === editingSectionIndex ? { ...s, ...sectionData } : s) } : p));
  };

  const handleEditQuestion = (question, questionIndex, pageIndex, sectionIndex = null) => { setEditingQuestion(question); setEditingQuestionIndex(questionIndex); setTargetPageIndex(pageIndex); setTargetSectionIndex(sectionIndex); setShowQuestionDialog(true); };
  const handleDeleteQuestion = (questionIndex, pageIndex, sectionIndex = null) => {
    applyPages(prev => prev.map((p, i) => {
      if (i !== pageIndex) return p;
      if (sectionIndex !== null) return { ...p, sections: p.sections.map((s, si) => si === sectionIndex ? { ...s, questions: (s.questions || []).filter((_, qi) => qi !== questionIndex) } : s) };
      const qLocal = p.questions[questionIndex];
      return { ...p, questions: p.questions.filter((_, qi) => qi !== questionIndex), items: (p.items || []).filter(it => !(it.kind === 'question' && it.id === qLocal.id)) };
    }));
  };
  const handleSaveQuestion = (questionData) => {
    const question = { ...questionData, id: questionData.id || uuidv4() };
    
    if (question.attribute) {
      isUpdatingFromFormBuilder.current = true;
      const newLanData = (() => {
        const updated = { ...lanAttributeRowData };
        languages.forEach((lang) => {
          const arr = updated[lang] || [];
          const idx = arr.findIndex((it) => it.Attribute === question.attribute);
          if (idx !== -1) {
            const existing = arr[idx];
            const newLabel = typeof question.title === 'object' && question.title !== null 
              ? (question.title[lang] || existing.Label || question.attribute) 
              : (question.title || existing.Label || question.attribute);
            const newPlaceholder = typeof question.placeholder === 'object' && question.placeholder !== null 
              ? (question.placeholder[lang] || existing.Placeholder || '') 
              : (question.placeholder || existing.Placeholder || '');
            const newDescription = typeof question.description === 'object' && question.description !== null 
              ? (question.description[lang] || existing.Description || '') 
              : (question.description || existing.Description || '');
            arr[idx] = { ...existing, Label: newLabel, Placeholder: newPlaceholder, Description: newDescription };
          }
        });
        return updated;
      })();
      updateSchema({ lanAttributeRowData: newLanData });
    }
    
    applyPages(prev => prev.map((p, i) => {
      if (i !== targetPageIndex) return p;
      if (editingQuestionIndex >= 0) {
        if (targetSectionIndex !== null) return { ...p, sections: p.sections.map((s, si) => si === targetSectionIndex ? { ...s, questions: (s.questions || []).map((q, qi) => qi === editingQuestionIndex ? question : q) } : s) };
        return { ...p, questions: p.questions.map((q, qi) => qi === editingQuestionIndex ? question : q) };
      }
      if (targetSectionIndex !== null) return { ...p, sections: p.sections.map((s, si) => si === targetSectionIndex ? { ...s, questions: [ ...(s.questions || []), question ] } : s) };
      return { ...p, questions: [...p.questions, question], items: [ ...(p.items || []), { kind: 'question', id: question.id } ] };
    }));
  };

  const handleMoveSection = (fromPageIndex, fromSectionIndex, toPageIndex) => applyPages(prev => moveSectionBetweenPages(prev, fromPageIndex, fromSectionIndex, toPageIndex));
  const handleMoveQuestion = (fromPageIndex, fromQuestionIndex, toPageIndex, fromSectionIndex = null) => applyPages(prev => moveQuestionToPage(prev, fromPageIndex, fromQuestionIndex, toPageIndex, fromSectionIndex));
  const handleMoveQuestionToSection = (fromPageIndex, fromQuestionIndex, toPageIndex, toSectionIndex, fromSectionIndex = null) => applyPages(prev => moveQuestionToSection(prev, fromPageIndex, fromQuestionIndex, toPageIndex, toSectionIndex, fromSectionIndex));
  const handleReorderQuestion = (pageIndex, sectionIndexOrNull, fromIndex, toIndex) => applyPages(prev => reorderQuestionInContainer(prev, pageIndex, sectionIndexOrNull, fromIndex, toIndex));
  const handleReorderPage = (fromIndex, toIndex) => applyPages(prev => reorderPages(prev, fromIndex, toIndex));
  const handleReorderPageItem = (pageIndex, fromIndexInItems, toIndexInItems) => applyPages(prev => reorderPageItems(prev, pageIndex, fromIndexInItems, toIndexInItems));
  const handleMovePageItem = (fromPageIndex, fromIndexInItems, toPageIndex) => applyPages(prev => movePageItemToPage(prev, fromPageIndex, fromIndexInItems, toPageIndex));

  const createQuestionFromPaletteItem = (item) => {
    const { attribute, labels, formatText, attributeType, placeholders } = item;
    const formFieldType = attributeType?.includes('Text') ? 'textarea' : 'text';
    const title = {};
    const placeholder = {};
    const description = {};
    languages.forEach(lang => {
      title[lang] = labels?.[lang] || labels?.['default'] || attribute;
      placeholder[lang] = placeholders?.[lang] || placeholders?.['default'] || '';
      const langData = lanAttributeRowData?.[lang]?.find(r => r.Attribute === attribute);
      description[lang] = langData?.Description || '';
    });
    
    // Convert entry codes (list options) to options format
    const options = [];
    if (attributesWithLists?.includes(attribute) && savedEntryCodes?.[attribute]) {
      savedEntryCodes[attribute].forEach((entryCode) => {
        const optionLabels = {};
        languages.forEach(lang => {
          optionLabels[lang] = entryCode[lang] || entryCode.Code;
        });
        options.push({
          id: uuidv4(),
          code: entryCode.Code,
          value: entryCode.Code,
          label: optionLabels[languages[0] || LanguageConstants.DEFAULT_LANG_NAME] || entryCode.Code,
          labels: optionLabels
        });
      });
    }
    
    return { 
      id: uuidv4(), 
      attribute, 
      title, 
      formatText: formatText || '', 
      attributeType: attributeType || '', 
      type: formFieldType, 
      placeholder, 
      description,
      required: false, 
      options 
    };
  };

  const handleDropPaletteQuestion = (pageIndex, item) => {
    if (usedAttributes.has(item.attribute)) return;
    const newQuestion = createQuestionFromPaletteItem(item);
    applyPages(prev => prev.map((p, i) => i === pageIndex ? { ...p, questions: [...(p.questions || []), newQuestion], items: [ ...(p.items || []), { kind: 'question', id: newQuestion.id } ] } : p));
  };

  const handleDropPaletteQuestionToSection = (pageIndex, sectionIndex, item) => {
    if (usedAttributes.has(item.attribute)) return;
    const newQuestion = createQuestionFromPaletteItem(item);
    applyPages(prev => prev.map((p, pi) => pi !== pageIndex ? p : ({ ...p, sections: p.sections.map((s, si) => si !== sectionIndex ? s : ({ ...s, questions: [ ...(s.questions || []), newQuestion ] })) })));
  };

  const validateForm = useCallback(() => ({ ok: true }), []);

  const handleForward = useCallback(() => {
    const validation = validateForm();
    if (!validation.ok) return;


    const formData = convertToFormInformation(pages);
    updateSchema({ formBuilderPages: pages, FormInformationRowData: formData });

    setSelectedOverlay("");
    setCurrentPage("Overlays");
  }, [validateForm, pages, updateSchema, setSelectedOverlay, setCurrentPage]);

  const handleBack = useCallback(() => {
    setCurrentPage("FormInformation");
  }, [setCurrentPage]);

  // Build language tabs (same pattern as Form Information / Language Details)
  const displayLanguageArray = [];
  for (let i = 0; i < filteredLanguages.length; i += 6) {
    const languageRow = filteredLanguages.slice(i, i + 6).filter(Boolean);
    displayLanguageArray.push(languageRow);
  }

  const renderLanguageTabButtons = (languageSegment) =>
    languageSegment.map((language) => {
      const selected = currentLanguage === language;
      return (
        <Button
          key={language}
          onClick={() => setCurrentLanguage(language)}
          variant="text"
          color="inherit"
          sx={{
            textTransform: "none",
            fontWeight: 400,
            borderRadius: 0,
            px: 2,
            py: 1.25,
            width: languages.length < 5 ? "12rem" : "8.335rem",
            minWidth: languages.length < 5 ? "12rem" : "8.335rem",
            color: selected ? CustomPalette.BLACK : CustomPalette.GREY_600,
            bgcolor: "transparent",
            boxShadow: "none",
            borderBottom: "2px solid",
            borderBottomColor: selected ? CustomPalette.BLACK : "transparent",
            mb: "-1px",
            "&:hover": {
              bgcolor: "rgba(0, 0, 0, 0.04)",
              color: CustomPalette.BLACK
            }
          }}
        >
          <Typography noWrap variant="body2" sx={{ fontWeight: 400 }}>
            {t(language, { defaultValue: language })}
          </Typography>
        </Button>
      );
    });

  const addPageButton = (
    <Button
      startIcon={<AddIcon />}
      onClick={handleAddPage}
      variant="contained"
      color="button"
      sx={{
        flexShrink: 0,
        alignSelf: "flex-end",
        backgroundColor: CustomPalette.PRIMARY,
        "&:hover": {
          backgroundColor: CustomPalette.DARK
        }
      }}
    >
      {t("Add Page")}
    </Button>
  );

  const languageButtonDisplay = [];
  if (displayLanguageArray.length === 0) {
    languageButtonDisplay.push(
      <Box
        key="add-page-only"
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          width: "100%",
          borderBottom: `1px solid ${CustomPalette.GREY_300}`
        }}
      >
        {addPageButton}
      </Box>
    );
  } else {
    displayLanguageArray.forEach((languageSegment, index) => {
      const isLast = index === displayLanguageArray.length - 1;
      if (!isLast) {
        languageButtonDisplay.push(
          <Box
            key={index}
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              alignSelf: "flex-start",
              borderBottom: `1px solid ${CustomPalette.GREY_300}`
            }}
          >
            {renderLanguageTabButtons(languageSegment)}
          </Box>
        );
      } else {
        languageButtonDisplay.push(
          <Box
            key={index}
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 1,
              width: "100%"
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-end",
                minWidth: 0,
                borderBottom: `1px solid ${CustomPalette.GREY_300}`
              }}
            >
              {renderLanguageTabButtons(languageSegment)}
            </Box>
            {addPageButton}
          </Box>
        );
      }
    });
  }

  return (
    <BackNextSkeleton isForward pageForward={handleForward} isBack pageBack={handleBack}>
      <DndProvider backend={HTML5Backend}>
        <Box sx={{ margin: "2rem", marginTop: "0.5rem", marginBottom: BETWEEN_SECTION_SPACING }}>
          <Box sx={{ mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: "bold", color: primaryColor, textAlign: "center", mb: 4 }}>
              {t("Layout Builder")}
            </Typography>
          </Box>

          <Box
            sx={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              mb: 2,
              gap: 1
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
              {languageButtonDisplay}
            </Box>
            <Box
              sx={{
                position: "absolute",
                right: "100%",
                top: "50%",
                transform: "translateY(-50%)",
                marginRight: 1,
                color: CustomPalette.GREY_600
              }}
            >
              <Tooltip
                title={t("Toggles between the one or more languages used in the schema")}
                placement="left"
                arrow
                PopperProps={{
                  sx: { "& .MuiTooltip-tooltip": { width: 100 } }
                }}
              >
                <HelpOutlineIcon sx={{ fontSize: 15 }} />
              </Tooltip>
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "320px 1fr" },
              gap: 3,
              alignItems: "start"
            }}
          >
            <AttributePalette
              attributesList={attributesList}
              FormInformationRowData={FormInformationRowData}
              usedAttributes={usedAttributes}
              formatRuleRowData={formatRuleRowData}
              attributeRowData={attributeRowData}
              lanAttributeRowData={lanAttributeRowData}
              currentLanguage={currentLanguage}
              languages={languages}
            />
            <Box sx={{ width: "100%" }}>
              {pages.map((page, pageIndex) => (
              <DroppablePage
                  key={page.id}
                  page={page}
                  pageIndex={pageIndex}
                  currentLanguage={currentLanguage}
                  onEditPage={handleEditPage}
                  onDeletePage={handleDeletePage}
                  onAddSection={handleAddSection}
                  onEditSection={handleEditSection}
                  onDeleteSection={handleDeleteSection}
                  onMoveSection={handleMoveSection}
                  onEditQuestion={handleEditQuestion}
                  onDeleteQuestion={handleDeleteQuestion}
                  onMoveQuestion={handleMoveQuestion}
                  onMoveQuestionToSection={handleMoveQuestionToSection}
                  onReorderQuestion={handleReorderQuestion}
                  onDropPaletteQuestion={handleDropPaletteQuestion}
                  onDropPaletteQuestionToSection={handleDropPaletteQuestionToSection}
                  onReorderPage={handleReorderPage}
                  onReorderPageItem={handleReorderPageItem}
                  onMovePageItem={handleMovePageItem}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </DndProvider>

      <QuestionEditorDialog
        open={showQuestionDialog}
        onClose={() => setShowQuestionDialog(false)}
        question={editingQuestion}
        onSave={handleSaveQuestion}
        languages={languages}
        childAttributeOptions={childAttributeOptionsByParent[editingQuestion?.attribute] || []}
      />
      <SectionEditorDialog open={showSectionDialog} onClose={() => setShowSectionDialog(false)} section={editingSection} onSave={handleSaveSection} languages={languages} />
      <PageEditorDialog open={showPageDialog} onClose={() => setShowPageDialog(false)} page={editingPage} onSave={handleSavePage} languages={languages} />
    </BackNextSkeleton>
  );
};

export default FormBuilder;


