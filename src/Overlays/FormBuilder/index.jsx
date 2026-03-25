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
import { langNameFromTwoLetters, LanguageConstants, getLanguageButtonBorderRadius } from "../../utils/languageUtils";
import i18next from "i18next";

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
  const {
    setCurrentPage,
    setSelectedOverlay
  } = useContext(Context);

  const {
    getSchema,
    updateSchema,
    getAttributesList,
    getFormatRuleData
  } = useMultiSchema();
  const schemaState = getSchema();
  
  const languages = schemaState?.metadata?.languages || [LanguageConstants.DEFAULT_LANG_NAME];
  const savedEntryCodes = schemaState?.entryCodes || {};
  const attributesWithLists = schemaState?.attributesWithLists || [];
  
  const attributesList = getAttributesList();
  const formatRuleRowData = getFormatRuleData();
  const attributeRowData = schemaState?.attributes || [];
  const lanAttributeRowData = schemaState?.lanAttributeRowData || {};
  const FormInformationRowData = schemaState?.FormInformationRowData || [];
  const formBuilderPages = schemaState?.formBuilderPages || [];
  const languageIndex = languages.findIndex(
    (item) => langNameFromTwoLetters(i18next.language) === item
  );
  const filteredLanguages = [...languages];
  if (languageIndex !== -1 && languageIndex !== 0) {
    const removedLanguage = filteredLanguages.splice(languageIndex, 1);
    filteredLanguages.unshift(removedLanguage[0]);
  }
  const [currentLanguage, setCurrentLanguage] = useState(filteredLanguages[0] || LanguageConstants.DEFAULT_LANG_NAME);

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

  const usedAttributes = useUsedAttributes(pages);

  useEffect(() => {
    updateSchema({ formBuilderPages: pages });
  }, [pages, updateSchema]);

  useEffect(() => {
    if (!pages || pages.length === 0) return;
    if (isUpdatingFromFormBuilder.current) {
      isUpdatingFromFormBuilder.current = false;
      return;
    }

    const syncQuestionData = (question) => {
      const { attribute } = question;
      if (!attribute) return question;

      const attributeInfo = attributeRowData.find((r) => r.Attribute === attribute);
      const formatRule = formatRuleRowData.find((rule) => rule.Attribute === attribute);
      const attributeType = attributeInfo?.Type || question.attributeType;
      const formatText = formatRule?.FormatText || '';

      const updatedTitle = {};
      languages.forEach(lang => {
        const langData = lanAttributeRowData?.[lang]?.find(item => item.Attribute === attribute);
        updatedTitle[lang] = langData?.Label || question.title?.[lang] || attribute;
      });

      const updatedPlaceholder = {};
      languages.forEach(lang => {
        const langData = lanAttributeRowData?.[lang]?.find(item => item.Attribute === attribute);
        updatedPlaceholder[lang] = langData?.Placeholder || question.placeholder?.[lang] || '';
      });

      const updatedDescription = {};
      languages.forEach(lang => {
        const langData = lanAttributeRowData?.[lang]?.find(item => item.Attribute === attribute);
        updatedDescription[lang] = langData?.FormDescription || question.description?.[lang] || '';
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

    const syncPageData = (page) => {
      const syncedQuestions = (page.questions || []).map(syncQuestionData);
      const syncedSections = (page.sections || []).map(section => ({
        ...section,
        questions: (section.questions || []).map(syncQuestionData)
      }));

      return {
        ...page,
        questions: syncedQuestions,
        sections: syncedSections
      };
    };

    const syncedPages = pages.map(syncPageData);
    
    const hasChanges = JSON.stringify(syncedPages) !== JSON.stringify(pages);
    if (hasChanges) {
      setPages(syncedPages);
    }
  }, [lanAttributeRowData, formatRuleRowData, attributeRowData, savedEntryCodes, attributesWithLists, languages]);

  const handleAddPage = () => {
    const pageNumber = pages.length + 1;
    const newPage = { id: uuidv4(), ...initializePageLabels(pageNumber, languages), questions: [], sections: [], items: [] };
    setPages(prev => [...prev, newPage]);
  };

  const handleAddSection = (pageIndex) => {
    const sectionNumber = (pages[pageIndex].sections?.length || 0) + 1;
    const newSection = { id: uuidv4(), ...initializeSectionLabels(sectionNumber, languages), questions: [] };
    setPages(prev => prev.map((p, i) => i === pageIndex ? { ...p, sections: [...(p.sections || []), newSection], items: [ ...(p.items || []), { kind: 'section', id: newSection.id } ] } : p));
  };

  const handleEditPage = (page, pageIndex) => { setEditingPage(page); setEditingPageIndex(pageIndex); setShowPageDialog(true); };
  const handleDeletePage = (pageIndex) => { if (pages.length > 1) setPages(prev => prev.filter((_, i) => i !== pageIndex)); };
  const handleSavePage = (pageData) => { setPages(prev => prev.map((p, i) => i === editingPageIndex ? { ...p, ...pageData } : p)); };

  const handleEditSection = (section, sectionIndex, pageIndex) => { setEditingSection(section); setEditingSectionIndex(sectionIndex); setTargetPageIndex(pageIndex); setShowSectionDialog(true); };
  const handleDeleteSection = (sectionIndex, pageIndex) => {
    setPages(prev => prev.map((p, i) => {
      if (i !== pageIndex) return p;
      const section = p.sections[sectionIndex];
      const newSections = (p.sections || []).filter((_, s) => s !== sectionIndex);
      const newItems = (p.items || []).filter(it => !(it.kind === 'section' && it.id === section.id));
      return { ...p, sections: newSections, items: newItems };
    }));
  };
  const handleSaveSection = (sectionData) => {
    setPages(prev => prev.map((p, i) => i === targetPageIndex ? { ...p, sections: p.sections.map((s, si) => si === editingSectionIndex ? { ...s, ...sectionData } : s) } : p));
  };

  const handleEditQuestion = (question, questionIndex, pageIndex, sectionIndex = null) => { setEditingQuestion(question); setEditingQuestionIndex(questionIndex); setTargetPageIndex(pageIndex); setTargetSectionIndex(sectionIndex); setShowQuestionDialog(true); };
  const handleDeleteQuestion = (questionIndex, pageIndex, sectionIndex = null) => {
    setPages(prev => prev.map((p, i) => {
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
            const newFormDescription = typeof question.description === 'object' && question.description !== null 
              ? (question.description[lang] || existing.FormDescription || '') 
              : (question.description || existing.FormDescription || '');
            arr[idx] = { ...existing, Label: newLabel, Placeholder: newPlaceholder, FormDescription: newFormDescription };
          }
        });
        return updated;
      })();
      updateSchema({ lanAttributeRowData: newLanData });
    }
    
    setPages(prev => prev.map((p, i) => {
      if (i !== targetPageIndex) return p;
      if (editingQuestionIndex >= 0) {
        if (targetSectionIndex !== null) return { ...p, sections: p.sections.map((s, si) => si === targetSectionIndex ? { ...s, questions: (s.questions || []).map((q, qi) => qi === editingQuestionIndex ? question : q) } : s) };
        return { ...p, questions: p.questions.map((q, qi) => qi === editingQuestionIndex ? question : q) };
      }
      if (targetSectionIndex !== null) return { ...p, sections: p.sections.map((s, si) => si === targetSectionIndex ? { ...s, questions: [ ...(s.questions || []), question ] } : s) };
      return { ...p, questions: [...p.questions, question], items: [ ...(p.items || []), { kind: 'question', id: question.id } ] };
    }));
  };

  const handleMoveSection = (fromPageIndex, fromSectionIndex, toPageIndex) => setPages(prev => moveSectionBetweenPages(prev, fromPageIndex, fromSectionIndex, toPageIndex));
  const handleMoveQuestion = (fromPageIndex, fromQuestionIndex, toPageIndex, fromSectionIndex = null) => setPages(prev => moveQuestionToPage(prev, fromPageIndex, fromQuestionIndex, toPageIndex, fromSectionIndex));
  const handleMoveQuestionToSection = (fromPageIndex, fromQuestionIndex, toPageIndex, toSectionIndex, fromSectionIndex = null) => setPages(prev => moveQuestionToSection(prev, fromPageIndex, fromQuestionIndex, toPageIndex, toSectionIndex, fromSectionIndex));
  const handleReorderQuestion = (pageIndex, sectionIndexOrNull, fromIndex, toIndex) => setPages(prev => reorderQuestionInContainer(prev, pageIndex, sectionIndexOrNull, fromIndex, toIndex));
  const handleReorderPage = (fromIndex, toIndex) => setPages(prev => reorderPages(prev, fromIndex, toIndex));
  const handleReorderPageItem = (pageIndex, fromIndexInItems, toIndexInItems) => setPages(prev => reorderPageItems(prev, pageIndex, fromIndexInItems, toIndexInItems));
  const handleMovePageItem = (fromPageIndex, fromIndexInItems, toPageIndex) => setPages(prev => movePageItemToPage(prev, fromPageIndex, fromIndexInItems, toPageIndex));

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
      description[lang] = langData?.FormDescription || '';
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
    setPages(prev => prev.map((p, i) => i === pageIndex ? { ...p, questions: [...(p.questions || []), newQuestion], items: [ ...(p.items || []), { kind: 'question', id: newQuestion.id } ] } : p));
  };
  
  const handleDropPaletteQuestionToSection = (pageIndex, sectionIndex, item) => {
    if (usedAttributes.has(item.attribute)) return;
    const newQuestion = createQuestionFromPaletteItem(item);
    setPages(prev => prev.map((p, pi) => pi !== pageIndex ? p : ({ ...p, sections: p.sections.map((s, si) => si !== sectionIndex ? s : ({ ...s, questions: [ ...(s.questions || []), newQuestion ] })) })));
  };

  const validateForm = useCallback(() => ({ ok: true }), []);

  const handleForward = useCallback(() => {
    const validation = validateForm();
    if (!validation.ok) return;
    
    const formData = convertToFormInformation(pages);
    updateSchema({ FormInformationRowData: formData });

    setSelectedOverlay("");
    setCurrentPage("Overlays");
  }, [validateForm, pages, updateSchema, setSelectedOverlay, setCurrentPage, languages]);

  const handleBack = useCallback(() => {
    setCurrentPage("FormInformation");
  }, [setCurrentPage]);

  // Build Language Tabs
  const displayLanguageArray = [];
  for (let i = 0; i < filteredLanguages.length; i += 6) {
    const languageRow = filteredLanguages.slice(i, i + 6).filter(Boolean);
    displayLanguageArray.push(languageRow);
  }

  const createLanguageRow = (languageArray, rowIndex) => {
    const languageRowDisplay = languageArray.map((language, index) => {
      const borderRadius = getLanguageButtonBorderRadius(index, languageArray, rowIndex, displayLanguageArray, languages.length, 6);
      return (
        <Button
          key={language}
          onClick={() => setCurrentLanguage(language)}
          color="button"
          variant="contained"
          sx={{
            backgroundColor:
              currentLanguage === language
                ? CustomPalette.PRIMARY
                : CustomPalette.WHITE,
            color:
              currentLanguage === language
                ? "white"
                : CustomPalette.PRIMARY,
            borderRadius,
            minWidth: languages.length < 5 ? "12rem" : "10rem",
            boxShadow: "none",
            border: `1px solid ${CustomPalette.PRIMARY}`,
            "&:hover": {
              backgroundColor:
                currentLanguage === language
                  ? CustomPalette.PRIMARY
                  : CustomPalette.WHITE,
              boxShadow:
                currentLanguage === language
                  ? "none"
                  : undefined
            }
          }}
        >
          <Typography noWrap variant="button">
            {t(language, { defaultValue: language })}
          </Typography>
        </Button>
      );
    });
    return languageRowDisplay;
  };

  const languageButtonDisplay = displayLanguageArray.map((languageSegment, index) => (
    <Box key={index}>{createLanguageRow(languageSegment, index)}</Box>
  ));

  return (
    <BackNextSkeleton isForward pageForward={handleForward} isBack pageBack={handleBack}>
      <DndProvider backend={HTML5Backend}>
        <Box sx={{ margin: "2rem", marginTop: "0.5rem", marginBottom: BETWEEN_SECTION_SPACING }}>
          <Box sx={{ mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: CustomPalette.GREY_800, textAlign: 'center', mb: 4 }}>
              {t("Layout Builder")}
            </Typography>
          </Box>

          <Box
            sx={{
              position: "relative",
              display: "flex",
              flexDirection: "column-reverse",
              alignItems: languages.length < 6 ? "flex-start" : "flex-end",
              mb: 2,
              gap: 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>{languageButtonDisplay}</Box>
              <Button 
                startIcon={<AddIcon />} 
                onClick={handleAddPage} 
                variant="contained" 
                color="button"
                sx={{ 
                  backgroundColor: CustomPalette.PRIMARY,
                  '&:hover': {
                    backgroundColor: CustomPalette.DARK
                  }
                }}
              >
                {t("Add Page")}
              </Button>
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
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '320px 1fr' }, 
              gap: 3, 
              alignItems: 'start'
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

            <Box sx={{ width: '100%' }}>
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

      <QuestionEditorDialog open={showQuestionDialog} onClose={() => setShowQuestionDialog(false)} question={editingQuestion} onSave={handleSaveQuestion} languages={languages} />
      <SectionEditorDialog open={showSectionDialog} onClose={() => setShowSectionDialog(false)} section={editingSection} onSave={handleSaveSection} languages={languages} />
      <PageEditorDialog open={showPageDialog} onClose={() => setShowPageDialog(false)} page={editingPage} onSave={handleSavePage} languages={languages} />
    </BackNextSkeleton>
  );
};

export default FormBuilder;


