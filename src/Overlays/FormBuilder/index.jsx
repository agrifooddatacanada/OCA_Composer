import React, { useCallback, useContext, useMemo, useRef, useState, useEffect } from "react";
import { Context } from "../../App";
import BackNextSkeleton from "../../components/BackNextSkeleton";
import { Box, Button, Typography, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { CustomPalette } from "../../constants/customPalette";
import { Add as AddIcon } from "@mui/icons-material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import { codesToLanguages } from "../../constants/isoCodes";
import i18next from "i18next";

import AttributePalette from "./AttributePalette";
import DroppablePage from "./DroppablePage";
import QuestionEditorDialog from "./dialogs/QuestionEditorDialog";
import SectionEditorDialog from "./dialogs/SectionEditorDialog";
import PageEditorDialog from "./dialogs/PageEditorDialog";
import { useUsedAttributes } from "./hooks/useUsedAttributes";
import { convertToFormInformation, convertToFormInformationOverlay } from "./utils/convertToFormInformation";
import { moveQuestionToPage, moveQuestionToSection, moveSectionBetweenPages, reorderQuestionInContainer } from "./utils/moves";

const FormBuilder = () => {
  const { t } = useTranslation();
  const {
    FormInformationRowData,
    setFormInformationRowData,
    setCurrentPage,
    attributesList,
    setSelectedOverlay,
    languages,
    formatRuleRowData,
    attributeRowData,
    lanAttributeRowData,
    setLanAttributeRowData
  } = useContext(Context);

  
  const languageIndex = languages.findIndex(
    (item) => codesToLanguages?.[i18next.language] === item
  );
  const filteredLanguages = [...languages];
  if (languageIndex !== -1 && languageIndex !== 0) {
    const removedLanguage = filteredLanguages.splice(languageIndex, 1);
    filteredLanguages.unshift(removedLanguage[0]);
  }
  const [currentLanguage, setCurrentLanguage] = useState(filteredLanguages[0]);
  const primaryLanguage = languages?.[0];

  // Update currentLanguage when global UI language changes
  useEffect(() => {
    const userLanguage = codesToLanguages?.[i18next.language];
    if (userLanguage && languages.includes(userLanguage)) {
      setCurrentLanguage(userLanguage);
    }
  }, [i18next.language, languages]);

  const initializePageLabels = (pageNumber, langs) => {
    const defaultLabel = `Page ${pageNumber}`;
    const labels = {};
    const sidebarLabels = {};
    const subheadings = {};
    langs.forEach(lang => {
      labels[lang] = defaultLabel;
      sidebarLabels[lang] = defaultLabel;
      subheadings[lang] = defaultLabel;
    });
    return { labels, sidebarLabels, subheadings };
  };

  const initializeSectionLabels = (sectionNumber, langs) => {
    const defaultLabel = `Section ${sectionNumber}`;
    const labels = {};
    const subheadings = {};
    langs.forEach(lang => {
      labels[lang] = defaultLabel;
      subheadings[lang] = defaultLabel;
    });
    return { labels, subheadings };
  };

  const [pages, setPages] = useState([
    { id: uuidv4(), ...initializePageLabels(1, languages), questions: [], sections: [] }
  ]);
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
  const [errorMessage, setErrorMessage] = useState("");

  const usedAttributes = useUsedAttributes(pages);

  const handleAddPage = () => {
    const pageNumber = pages.length + 1;
    const newPage = { id: uuidv4(), ...initializePageLabels(pageNumber, languages), questions: [], sections: [] };
    setPages(prev => [...prev, newPage]);
  };

  const handleAddSection = (pageIndex) => {
    const sectionNumber = (pages[pageIndex].sections?.length || 0) + 1;
    const newSection = { id: uuidv4(), ...initializeSectionLabels(sectionNumber, languages), questions: [] };
    setPages(prev => prev.map((p, i) => i === pageIndex ? { ...p, sections: [...(p.sections || []), newSection] } : p));
  };

  const handleEditPage = (page, pageIndex) => { setEditingPage(page); setEditingPageIndex(pageIndex); setShowPageDialog(true); };
  const handleDeletePage = (pageIndex) => { if (pages.length > 1) setPages(prev => prev.filter((_, i) => i !== pageIndex)); };
  const handleSavePage = (pageData) => { setPages(prev => prev.map((p, i) => i === editingPageIndex ? { ...p, ...pageData } : p)); };

  const handleEditSection = (section, sectionIndex, pageIndex) => { setEditingSection(section); setEditingSectionIndex(sectionIndex); setTargetPageIndex(pageIndex); setShowSectionDialog(true); };
  const handleDeleteSection = (sectionIndex, pageIndex) => {
    setPages(prev => prev.map((p, i) => i === pageIndex ? { ...p, sections: (p.sections || []).filter((_, s) => s !== sectionIndex) } : p));
  };
  const handleSaveSection = (sectionData) => {
    setPages(prev => prev.map((p, i) => i === targetPageIndex ? { ...p, sections: p.sections.map((s, si) => si === editingSectionIndex ? { ...s, ...sectionData } : s) } : p));
  };

  const handleAddQuestion = (pageIndex) => { setTargetPageIndex(pageIndex); setEditingQuestion(null); setEditingQuestionIndex(-1); setShowQuestionDialog(true); };
  const handleEditQuestion = (question, questionIndex, pageIndex, sectionIndex = null) => { setEditingQuestion(question); setEditingQuestionIndex(questionIndex); setTargetPageIndex(pageIndex); setTargetSectionIndex(sectionIndex); setShowQuestionDialog(true); };
  const handleDeleteQuestion = (questionIndex, pageIndex, sectionIndex = null) => {
    setPages(prev => prev.map((p, i) => {
      if (i !== pageIndex) return p;
      if (sectionIndex !== null) return { ...p, sections: p.sections.map((s, si) => si === sectionIndex ? { ...s, questions: (s.questions || []).filter((_, qi) => qi !== questionIndex) } : s) };
      return { ...p, questions: p.questions.filter((_, qi) => qi !== questionIndex) };
    }));
  };
  const handleSaveQuestion = (questionData) => {
    const question = { ...questionData, id: questionData.id || uuidv4() };
    setPages(prev => prev.map((p, i) => {
      if (i !== targetPageIndex) return p;
      if (editingQuestionIndex >= 0) {
        if (targetSectionIndex !== null) return { ...p, sections: p.sections.map((s, si) => si === targetSectionIndex ? { ...s, questions: (s.questions || []).map((q, qi) => qi === editingQuestionIndex ? question : q) } : s) };
        return { ...p, questions: p.questions.map((q, qi) => qi === editingQuestionIndex ? question : q) };
      }
      if (targetSectionIndex !== null) return { ...p, sections: p.sections.map((s, si) => si === targetSectionIndex ? { ...s, questions: [ ...(s.questions || []), question ] } : s) };
      return { ...p, questions: [...p.questions, question] };
    }));
  };

  const handleMoveSection = (fromPageIndex, fromSectionIndex, toPageIndex) => setPages(prev => moveSectionBetweenPages(prev, fromPageIndex, fromSectionIndex, toPageIndex));
  const handleMoveQuestion = (fromPageIndex, fromQuestionIndex, toPageIndex, fromSectionIndex = null) => setPages(prev => moveQuestionToPage(prev, fromPageIndex, fromQuestionIndex, toPageIndex, fromSectionIndex));
  const handleMoveQuestionToSection = (fromPageIndex, fromQuestionIndex, toPageIndex, toSectionIndex, fromSectionIndex = null) => setPages(prev => moveQuestionToSection(prev, fromPageIndex, fromQuestionIndex, toPageIndex, toSectionIndex, fromSectionIndex));
  const handleReorderQuestion = (pageIndex, sectionIndexOrNull, fromIndex, toIndex) => setPages(prev => reorderQuestionInContainer(prev, pageIndex, sectionIndexOrNull, fromIndex, toIndex));

  const handleDropPaletteQuestion = (pageIndex, item) => {
    const { attribute, labels, formatText, attributeType, placeholders } = item;
    if (usedAttributes.has(attribute)) return;
    // Determine form field type based on attribute type (for output JSON)
    const formFieldType = attributeType?.includes('Text') ? 'textarea' : 'text';
    
    // Create multilingual title and placeholder
    const title = {};
    const placeholder = {};
    languages.forEach(lang => {
      title[lang] = labels?.[lang] || labels?.['default'] || attribute;
      placeholder[lang] = placeholders?.[lang] || placeholders?.['default'] || '';
    });
    
    const newQuestion = { 
      id: uuidv4(), 
      attribute, 
      title, 
      formatText: formatText || '', 
      attributeType: attributeType || '', 
      type: formFieldType, 
      placeholder, 
      required: false, 
      options: [] 
    };
    setPages(prev => prev.map((p, i) => i === pageIndex ? { ...p, questions: [...(p.questions || []), newQuestion] } : p));
  };
  
  const handleDropPaletteQuestionToSection = (pageIndex, sectionIndex, item) => {
    const { attribute, labels, formatText, attributeType, placeholders } = item;
    if (usedAttributes.has(attribute)) return;
    // Determine form field type based on attribute type (for output JSON)
    const formFieldType = attributeType?.includes('Text') ? 'textarea' : 'text';
    
    // Create multilingual title and placeholder
    const title = {};
    const placeholder = {};
    languages.forEach(lang => {
      title[lang] = labels?.[lang] || labels?.['default'] || attribute;
      placeholder[lang] = placeholders?.[lang] || placeholders?.['default'] || '';
    });
    
    const newQuestion = { 
      id: uuidv4(), 
      attribute, 
      title, 
      formatText: formatText || '', 
      attributeType: attributeType || '', 
      type: formFieldType, 
      placeholder, 
      required: false, 
      options: [] 
    };
    setPages(prev => prev.map((p, pi) => pi !== pageIndex ? p : ({ ...p, sections: p.sections.map((s, si) => si !== sectionIndex ? s : ({ ...s, questions: [ ...(s.questions || []), newQuestion ] })) })));
  };

  const validateForm = useCallback(() => ({ ok: true }), []);

  const handleForward = useCallback(() => {
    const validation = validateForm();
    if (!validation.ok) return;
    
    // Convert to both formats
    const formData = convertToFormInformation(pages);
    const hierarchicalData = convertToFormInformationOverlay(pages, languages);
    
    // Store both formats (you can choose which one to use or store both)
    setFormInformationRowData(formData);
    
    // Log the hierarchical structure for debugging
    console.log('Form Information Overlay:', JSON.stringify(hierarchicalData, null, 2));
    
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  }, [validateForm, pages, languages, setFormInformationRowData, setSelectedOverlay, setCurrentPage]);

  const handleBack = useCallback(() => setCurrentPage("FormInformation"), [setCurrentPage]);

  // Build Language Tabs (same UI as FormInformation)
  const displayLanguageArray = [];
  for (let i = 0; i < filteredLanguages.length; i += 6) {
    const languageRow = filteredLanguages.slice(i, i + 6).filter(Boolean);
    displayLanguageArray.push(languageRow);
  }

  const createLanguageRow = (languageArray, rowIndex) => {
    const languageRowDisplay = languageArray.map((language, index) => {
      let isFirstButton;
      if (languages.length > 6) {
        if (
          displayLanguageArray[rowIndex + 1] &&
          displayLanguageArray[rowIndex + 1].length === 6
        ) {
          isFirstButton =
            language === displayLanguageArray[displayLanguageArray.length - 1][0];
        } else {
          isFirstButton = index === 0;
        }
      } else {
        isFirstButton = index === 0;
      }
      const isLastButton = language === filteredLanguages[languages.length - 1];
      let borderRadius = "";
      if (isFirstButton && isLastButton) borderRadius = "8px 8px 0 0";
      else if (isFirstButton) borderRadius = "8px 0 0 0";
      else if (isLastButton) borderRadius = "0 8px 0 0";
      else borderRadius = "0";
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
                : CustomPalette.SECONDARY,
            borderRadius,
            width: languages.length < 5 ? "12rem" : "8.335rem",
            boxShadow: "none",
            border: `0.5px solid ${CustomPalette.PRIMARY}`
          }}
        >
          <Typography noWrap={true} variant="button">
            {language}
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
        <Box sx={{ margin: "2rem" }}>
          {/* Language Tabs - same UI as FormInformation */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column-reverse",
              alignItems: languages.length < 6 ? "flex-start" : "flex-end",
              mb: 2
            }}
          >
            {languageButtonDisplay}
          </Box>
          <Box
            sx={{
              textAlign: "left",
              transform: "translate(-25px, -25px)",
              color: CustomPalette.GREY_600,
              height: "0rem"
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

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: CustomPalette.GREY_800 }}>
              {t("Form Builder")}
            </Typography>
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

          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ color: CustomPalette.GREY_600 }}>
              {t("Drag attributes from the left into pages or sections. Each attribute can be used once.")}
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 3 }}>
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

            <Box>
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


