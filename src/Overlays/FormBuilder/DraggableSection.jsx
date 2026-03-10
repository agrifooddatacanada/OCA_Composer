import React from "react";
import { Card, CardContent, Box, Typography, IconButton } from "@mui/material";
import { useDrag, useDrop } from 'react-dnd';
import { DragIndicator as DragIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { CustomPalette } from "../../constants/customPalette";
import { FORM_BUILDER_CARD_WIDTH } from "../../constants/constants";
import DraggableQuestion from "./DraggableQuestion";
import getMultilingualText from "./utils/getMultilingualText";
import { textWrapStyle } from "../../constants/styles";
import DND_TYPES from './dnd/types';

const SectionQuestionsDropZone = ({ section, sectionIndex, pageIndex, onReorderQuestion, onMoveQuestionToSection, onDropPaletteQuestionToSection, children }) => {
  const ref = React.useRef(null);
  const [, drop] = useDrop({
    accept: [DND_TYPES.QUESTION, DND_TYPES.PALETTE_QUESTION],
    drop: (item, monitor) => {
      if (monitor.didDrop()) return;
      if (item.source === 'palette') { onDropPaletteQuestionToSection(pageIndex, sectionIndex, item); return; }
      if (item.type === DND_TYPES.QUESTION && ref.current) {
        const fromPageIndex = item.pageIndex;
        const fromSectionIndex = item.sectionIndex ?? null;
        const isSameSection = fromPageIndex === pageIndex && fromSectionIndex === sectionIndex;
        const clientOffset = monitor.getClientOffset();
        if (clientOffset) {
          const rect = ref.current.getBoundingClientRect();
          const questions = section.questions || [];
          const relY = (clientOffset.y - rect.top) / Math.max(rect.height, 1);
          const toIndex = Math.min(Math.max(0, Math.floor(relY * questions.length)), Math.max(0, questions.length - 1));
          if (isSameSection && toIndex !== item.index) {
            onReorderQuestion(pageIndex, sectionIndex, item.index, toIndex);
            return;
          }
          if (!isSameSection) {
            onMoveQuestionToSection(fromPageIndex, item.index, pageIndex, sectionIndex, fromSectionIndex);
            return;
          }
        }
      }
    }
  });
  return <Box ref={(n) => { ref.current = n; drop(n); }} sx={{ mt: 1 }}>{children}</Box>;
};

const DraggableSection = ({ section, index, pageIndex, currentLanguage, onEdit, onDelete, onMoveQuestionToSection, onDropPaletteQuestionToSection, onEditQuestion, onDeleteQuestion, onReorderQuestion, indexInItems, onReorderPageItem }) => {
  const ref = React.useRef(null);
  const [{ isDragging }, drag] = useDrag({ type: DND_TYPES.PAGE_ITEM, item: { type: DND_TYPES.PAGE_ITEM, kind: 'section', index, indexInItems, section, pageIndex }, collect: (m) => ({ isDragging: m.isDragging() }) });
  const [{ isOver }, drop] = useDrop({
    accept: [DND_TYPES.QUESTION, DND_TYPES.PALETTE_QUESTION, DND_TYPES.PAGE_ITEM],
    drop: (item, monitor) => {
      if (monitor.didDrop()) return;
      if (item.source === 'palette') { onDropPaletteQuestionToSection(pageIndex, index, item); return; }
      if (item.type === DND_TYPES.QUESTION) {
        const fromPageIndex = item.pageIndex;
        const fromSectionIndex = item.sectionIndex ?? null;
        const isSameSection = fromPageIndex === pageIndex && fromSectionIndex === index;
        if (isSameSection) {
          onReorderQuestion(pageIndex, index, item.index, 0);
          return;
        }
        onMoveQuestionToSection(fromPageIndex, item.index, pageIndex, index, fromSectionIndex);
      }
    },
    hover: (item, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      if (item.type === DND_TYPES.PAGE_ITEM) {
        if (item.pageIndex !== pageIndex) return;
        if (item.indexInItems === indexInItems) return;
        if (ref.current) {
          const hoverBoundingRect = ref.current.getBoundingClientRect();
          const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
          const clientOffset = monitor.getClientOffset();
          if (clientOffset) {
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            if (item.indexInItems < indexInItems && hoverClientY < hoverMiddleY) return;
            if (item.indexInItems > indexInItems && hoverClientY > hoverMiddleY) return;
          }
        }
        onReorderPageItem(pageIndex, item.indexInItems, indexInItems);
        item.indexInItems = indexInItems;
      }
    },
    collect: (monitor) => ({ isOver: monitor.isOver() })
  });

  const sectionTitle = getMultilingualText(section.labels, currentLanguage, section.id || `Section ${index + 1}`);
  const sectionDescription = getMultilingualText(section.descriptions, currentLanguage, '');

  return (
  <Card 
      ref={(node) => { ref.current = node; drag(drop(node)); }} 
      sx={{ 
        mb: 1, 
        opacity: isDragging ? 0.5 : 1, 
        cursor: 'move', 
        border: isOver ? `2px dashed ${CustomPalette.PRIMARY}` : `2px solid ${CustomPalette.PRIMARY}`,
        backgroundColor: CustomPalette.PINK_200,
        boxShadow: 1,
        width: '100%',
        maxWidth: `${FORM_BUILDER_CARD_WIDTH}px`,
        flexShrink: 0
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: sectionDescription ? 1 : 0 }}>
          <DragIcon sx={{ color: CustomPalette.PRIMARY, mt: 0.5, flexShrink: 0 }} />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ position: 'relative', width: '100%' }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: CustomPalette.GREY_800,
                  textAlign: 'center',
                  px: 10,
                  ...textWrapStyle
                }}
              >
                {sectionTitle}
              </Typography>
              <Box sx={{ position: 'absolute', top: -4, right: 0, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton size="small" onClick={() => onEdit(section, index, pageIndex)} sx={{ color: CustomPalette.GREY_600 }}>
                  <EditIcon />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(index, pageIndex)} sx={{ color: CustomPalette.SECONDARY }}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Box>

        {sectionDescription && (
          <Box sx={{ mb: 1, ml: 4 }}>
            <Typography
              variant="body2"
              sx={{
                color: CustomPalette.GREY_600,
                fontStyle: 'italic',
                fontSize: '0.875rem',
                ...textWrapStyle
              }}
            >
              {sectionDescription}
            </Typography>
          </Box>
        )}

        <SectionQuestionsDropZone
          section={section}
          sectionIndex={index}
          pageIndex={pageIndex}
          onReorderQuestion={onReorderQuestion}
          onMoveQuestionToSection={onMoveQuestionToSection}
          onDropPaletteQuestionToSection={onDropPaletteQuestionToSection}
        >
          {(section.questions || []).map((question, questionIndex) => (
            <DraggableQuestion
              key={question.id}
              question={question}
              index={questionIndex}
              pageIndex={pageIndex}
              sectionIndex={index}
              currentLanguage={currentLanguage}
              onEdit={onEditQuestion}
              onDelete={onDeleteQuestion}
              onReorder={onReorderQuestion}
            />
          ))}
        </SectionQuestionsDropZone>
      </CardContent>
    </Card>
  );
};

export default DraggableSection;


