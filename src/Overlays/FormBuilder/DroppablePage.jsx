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
import { useDrop, useDrag } from "react-dnd";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as SectionIcon,
  DragIndicator as DragIcon
} from "@mui/icons-material";
import DraggableSection from "./DraggableSection";
import DraggableQuestion from "./DraggableQuestion";
import { CustomPalette } from "../../constants/customPalette";
import { FORM_BUILDER_CARD_WIDTH } from "../../constants/constants";
import { useTranslation } from "react-i18next";
import getMultilingualText from "./utils/getMultilingualText";
import { textWrapStyle } from "../../constants/styles";
import DND_TYPES from './dnd/types';

const DroppablePage = ({
  page,
  pageIndex,
  currentLanguage,
  onEditPage,
  onDeletePage,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onEditQuestion,
  onDeleteQuestion,
  onMoveQuestionToSection,
  onReorderQuestion,
  onDropPaletteQuestion,
  onDropPaletteQuestionToSection,
  onReorderPage,
  onReorderPageItem,
  onMovePageItem
}) => {
  const { t } = useTranslation();
  const itemsContainerRef = React.useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'page',
    item: { type: 'page', index: pageIndex, page },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [{ isOver }, drop] = useDrop({
    accept: [DND_TYPES.PAGE_ITEM, DND_TYPES.PALETTE_QUESTION, 'page'],
    drop: (item, monitor) => {
      if (monitor.didDrop()) return;
      if (item.source === "palette") { onDropPaletteQuestion(pageIndex, item); return; }
      if (item.type === DND_TYPES.PAGE_ITEM) {
        if (item.pageIndex !== pageIndex) {
          onMovePageItem(item.pageIndex, item.indexInItems, pageIndex);
        } else if (itemsContainerRef.current) {
          const clientOffset = monitor.getClientOffset();
          if (clientOffset) {
            const rect = itemsContainerRef.current.getBoundingClientRect();
            const items = page.items || [];
            const relY = (clientOffset.y - rect.top) / Math.max(rect.height, 1);
            const toIndex = Math.min(Math.max(0, Math.floor(relY * items.length)), items.length - 1);
            if (toIndex !== item.indexInItems) {
              onReorderPageItem(pageIndex, item.indexInItems, toIndex);
            }
          }
        }
      }
    },
    hover: (item, monitor) => {
      if (item.type !== 'page') return;
      if (!monitor.isOver({ shallow: true })) return;
      if (item.index === pageIndex) return;
      
      onReorderPage(item.index, pageIndex);
      item.index = pageIndex;
    },
    collect: (monitor) => ({ isOver: monitor.isOver() })
  });

  const pageTitle = getMultilingualText(page.labels, currentLanguage, page.id || `Page ${pageIndex + 1}`);
  const pageDescription = getMultilingualText(page.descriptions, currentLanguage, '');

  return (
    <Card
      ref={(node) => drag(drop(node))}
      sx={{
        mb: 2,
        border: isOver
          ? `2px dashed ${CustomPalette.PRIMARY}`
          : `1px solid ${CustomPalette.GREY_300}`,
        minHeight: 200,
        boxShadow: 2,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        width: '100%',
        maxWidth: `${FORM_BUILDER_CARD_WIDTH}px`,
        flexShrink: 0
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: pageDescription ? 1 : 2,
            gap: 1
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: 1, minWidth: 0 }}>
            <DragIcon sx={{ color: CustomPalette.GREY_600, cursor: 'grab' }} />
            <Typography
              variant="h5"
              sx={{ 
                fontWeight: "bold", 
                color: CustomPalette.GREY_800,
                textAlign: 'left',
                ...textWrapStyle
              }}
            >
              {pageTitle}
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

        {pageDescription && (
          <Box sx={{ mb: 2, ml: 4.1 }}>
            <Typography
              variant="body2"
              sx={{
                color: CustomPalette.GREY_600,
                fontStyle: 'italic',
                textAlign: 'left',
                ...textWrapStyle
              }}
            >
              {pageDescription}
            </Typography>
          </Box>
        )}

        <Box ref={itemsContainerRef} sx={{ minHeight: 100 }}>
          {(page.items || []).map((it, idx) => {
            if (it.kind === 'section') {
              const sectionIndex = (page.sections || []).findIndex(s => s.id === it.id);
              if (sectionIndex === -1) return null;
              const section = page.sections[sectionIndex];
              return (
                <DraggableSection
                  key={`section-${it.id}`}
                  section={section}
                  index={sectionIndex}
                  pageIndex={pageIndex}
                  currentLanguage={currentLanguage}
                  onEdit={onEditSection}
                  onDelete={onDeleteSection}
                  onMoveQuestionToSection={onMoveQuestionToSection}
                  onDropPaletteQuestionToSection={onDropPaletteQuestionToSection}
                  onEditQuestion={onEditQuestion}
                  onDeleteQuestion={onDeleteQuestion}
                  onReorderQuestion={onReorderQuestion}
                  indexInItems={idx}
                  onReorderPageItem={onReorderPageItem}
                />
              );
            }
            if (it.kind === 'question') {
              const questionIndex = (page.questions || []).findIndex(q => q.id === it.id);
              if (questionIndex === -1) return null;
              const question = page.questions[questionIndex];
              return (
                <DraggableQuestion
                  key={`question-${it.id}`}
                  question={question}
                  index={questionIndex}
                  pageIndex={pageIndex}
                  sectionIndex={null}
                  currentLanguage={currentLanguage}
                  onEdit={onEditQuestion}
                  onDelete={onDeleteQuestion}
                  onReorder={onReorderQuestion}
                  indexInItems={idx}
                  onReorderPageItem={onReorderPageItem}
                />
              );
            }
            return null;
          })}

          {((page.items?.length || 0) === 0) && (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  px: 3,
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
