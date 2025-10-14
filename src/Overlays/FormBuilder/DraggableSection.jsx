import React from "react";
import { Card, CardContent, Box, Typography, IconButton } from "@mui/material";
import { useDrag, useDrop } from 'react-dnd';
import { DragIndicator as DragIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { CustomPalette } from "../../constants/customPalette";
import { codesToLanguages } from "../../constants/isoCodes";
import i18next from "i18next";
import DraggableQuestion from "./DraggableQuestion";

const DraggableSection = ({ section, index, pageIndex, currentLanguage, onEdit, onDelete, onReorder, onMoveQuestionToSection, onDropPaletteQuestionToSection, onEditQuestion, onDeleteQuestion, onReorderQuestion }) => {
  const [{ isDragging }, drag] = useDrag({ type: 'section', item: { type: 'section', index, section, pageIndex }, collect: (m) => ({ isDragging: m.isDragging() }) });
  const [{ isOver }, drop] = useDrop({
    accept: ['question', 'palette-question', 'section'],
    drop: (item, monitor) => {
      if (monitor.didDrop()) return;
      if (item.source === 'palette') { onDropPaletteQuestionToSection(pageIndex, index, item); return; }
      if (item.type === 'question') {
        const fromPageIndex = item.pageIndex;
        const fromSectionIndex = item.sectionIndex ?? null;
        onMoveQuestionToSection(fromPageIndex, item.index, pageIndex, index, fromSectionIndex);
      }
    },
    hover: (item, monitor) => {
      if (item.type !== 'section') return;
      if (!monitor.isOver({ shallow: true })) return;
      if (item.pageIndex !== pageIndex) return;
      if (item.index === index) return;
      onReorder(pageIndex, item.index, index);
      item.index = index;
    },
    collect: (monitor) => ({ isOver: monitor.isOver() })
  });

  // Get the section title - prioritize currentLanguage tab, then user's global UI language, then fallback
  const getSectionTitle = () => {
    if (section.labels) {
      if (currentLanguage && section.labels[currentLanguage]) return section.labels[currentLanguage];
      const userLanguage = codesToLanguages?.[i18next.language];
      if (userLanguage && section.labels[userLanguage]) return section.labels[userLanguage];
      const firstLang = Object.keys(section.labels)[0];
      if (firstLang && section.labels[firstLang]) return section.labels[firstLang];
    }
    return section.id || `Section ${index + 1}`;
  };

  return (
    <Card 
      ref={(node) => drag(drop(node))} 
      sx={{ 
        mb: 1, 
        opacity: isDragging ? 0.5 : 1, 
        cursor: 'move', 
        border: isOver ? `2px dashed ${CustomPalette.PRIMARY}` : `2px solid ${CustomPalette.PRIMARY}`,
        backgroundColor: CustomPalette.PINK_200,
        boxShadow: 1
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DragIcon sx={{ color: CustomPalette.PRIMARY }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: CustomPalette.GREY_800 }}>{getSectionTitle()}</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton size="small" onClick={() => onEdit(section, index, pageIndex)} sx={{ color: CustomPalette.GREY_600 }}>
            <EditIcon />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete(index, pageIndex)} sx={{ color: CustomPalette.SECONDARY }}>
            <DeleteIcon />
          </IconButton>
        </Box>

        <Box sx={{ mt: 1 }}>
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
        </Box>
      </CardContent>
    </Card>
  );
};

export default DraggableSection;


