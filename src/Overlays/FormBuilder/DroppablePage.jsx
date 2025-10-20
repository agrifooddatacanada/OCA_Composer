import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Chip,
  Button
} from "@mui/material";
import { useDrop } from "react-dnd";
import {
  Title as TitleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as SectionIcon
} from "@mui/icons-material";
import DraggableSection from "./DraggableSection";
import DraggableQuestion from "./DraggableQuestion";
import { CustomPalette } from "../../constants/customPalette";
import { codesToLanguages } from "../../constants/isoCodes";
import i18next from "i18next";
import { useTranslation } from "react-i18next";

const DroppablePage = ({
  page,
  pageIndex,
  currentLanguage,
  onEditPage,
  onDeletePage,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onMoveSection,
  onReorderSection,
  onEditQuestion,
  onDeleteQuestion,
  onMoveQuestion,
  onMoveQuestionToSection,
  onReorderQuestion,
  onDropPaletteQuestion,
  onDropPaletteQuestionToSection
}) => {
  const { t } = useTranslation();

  const [{ isOver }, drop] = useDrop({
    accept: ["question", "section", "palette-question"],
    drop: (item, monitor) => {
      if (monitor.didDrop()) return;
      if (item.source === "palette") {
        onDropPaletteQuestion(pageIndex, item);
        return;
      }
      if (item.type === "question") {
        if (item.pageIndex !== pageIndex || item.sectionIndex !== null) {
          onMoveQuestion(item.pageIndex, item.index, pageIndex, item.sectionIndex);
        }
      } else if (item.type === "section") {
        if (item.pageIndex !== pageIndex)
          onMoveSection(item.pageIndex, item.index, pageIndex);
      }
    },
    collect: (monitor) => ({ isOver: monitor.isOver() })
  });

  // Get the page title - prioritize currentLanguage tab, then user's global UI language, then fallback
  const getPageTitle = () => {
    if (page.labels) {
      if (currentLanguage && page.labels[currentLanguage])
        return page.labels[currentLanguage];

      const userLanguage = codesToLanguages?.[i18next.language];
      if (userLanguage && page.labels[userLanguage]) return page.labels[userLanguage];

      const firstLang = Object.keys(page.labels)[0];
      if (firstLang && page.labels[firstLang]) return page.labels[firstLang];
    }
    return page.id || `Page ${pageIndex + 1}`;
  };

  return (
    <Card
      ref={drop}
      sx={{
        mb: 2,
        border: isOver
          ? `2px dashed ${CustomPalette.PRIMARY}`
          : `1px solid ${CustomPalette.GREY_300}`,
        minHeight: 200,
        boxShadow: 2
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
            gap: 1
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{ 
                fontWeight: "bold", 
                color: CustomPalette.GREY_800,
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'normal',
                lineHeight: 1.4
              }}
            >
              {getPageTitle()}
            </Typography>
            <Chip
              label={`${(page.questions?.length || 0) + (page.sections?.reduce((acc, s) => acc + (s.questions?.length || 0), 0) || 0)} ${t("questions")}`}
              size="small"
              sx={{
                backgroundColor: CustomPalette.PINK_200,
                color: CustomPalette.GREY_800,
                flexShrink: 0
              }}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
            <IconButton
              size="small"
              onClick={() => onEditPage(page, pageIndex)}
              sx={{ color: CustomPalette.GREY_600 }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDeletePage(pageIndex)}
              sx={{ color: CustomPalette.SECONDARY }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ minHeight: 100 }}>
          {page.sections?.map((section, sectionIndex) => (
            <DraggableSection
              key={section.id}
              section={section}
              index={sectionIndex}
              pageIndex={pageIndex}
              currentLanguage={currentLanguage}
              onEdit={onEditSection}
              onDelete={onDeleteSection}
              onReorder={onReorderSection}
              onMoveQuestionToSection={onMoveQuestionToSection}
              onDropPaletteQuestionToSection={onDropPaletteQuestionToSection}
              onEditQuestion={onEditQuestion}
              onDeleteQuestion={onDeleteQuestion}
              onReorderQuestion={onReorderQuestion}
            />
          ))}

          {page.questions
            ?.filter((q) => !q.sectionId)
            .map((question, questionIndex) => (
              <DraggableQuestion
                key={question.id}
                question={question}
                index={questionIndex}
                pageIndex={pageIndex}
                sectionIndex={null}
                currentLanguage={currentLanguage}
                onEdit={onEditQuestion}
                onDelete={onDeleteQuestion}
                onReorder={onReorderQuestion}
              />
            ))}

          {(page.sections?.length === 0 || !page.sections) &&
            (page.questions?.length === 0 || !page.questions) && (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  border: `2px dashed ${CustomPalette.GREY_300}`,
                  borderRadius: 1,
                  color: CustomPalette.GREY_600,
                  backgroundColor: CustomPalette.GREY_200
                }}
              >
                <Typography>
                  {t("Drop questions or sections here, or add new ones")}
                </Typography>
              </Box>
            )}
        </Box>

        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Button
            startIcon={<SectionIcon />}
            onClick={() => onAddSection(pageIndex)}
            variant="outlined"
            color="button"
            sx={{ borderColor: CustomPalette.PRIMARY, color: CustomPalette.PRIMARY }}
          >
            {t("Add Section")}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DroppablePage;
