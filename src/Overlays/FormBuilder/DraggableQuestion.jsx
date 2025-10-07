import React from "react";
import { Card, CardContent, Box, Typography, IconButton } from "@mui/material";
import { useDrag, useDrop } from 'react-dnd';
import { DragIndicator as DragIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { CustomPalette } from "../../constants/customPalette";
import { codesToLanguages } from "../../constants/isoCodes";
import i18next from "i18next";
import {
  formatCodeBinaryDescription,
  formatCodeDateDescription,
  formatCodeNumericDescription,
  formatCodeTextDescription
} from "../../constants/constants";

const findDescription = (formatText, attributeType) => {
  if (!formatText) return "";
  if (attributeType?.includes("Date")) return formatCodeDateDescription[formatText] || "";
  if (attributeType?.includes("Numeric"))
    return formatCodeNumericDescription[formatText] || "";
  if (attributeType?.includes("Binary"))
    return formatCodeBinaryDescription[formatText] || "";
  if (attributeType?.includes("Text")) return formatCodeTextDescription[formatText] || "";
  return formatText;
};

const DraggableQuestion = ({ question, index, pageIndex, sectionIndex, currentLanguage, onEdit, onDelete, onReorder }) => {
  const [{ isDragging }, drag] = useDrag({ type: 'question', item: { index, question, pageIndex, sectionIndex }, collect: (m) => ({ isDragging: m.isDragging() }) });
  const [{ }, drop] = useDrop({
    accept: 'question',
    canDrop: (item) => item.pageIndex === pageIndex && (item.sectionIndex ?? null) === (sectionIndex ?? null) && item.index !== index,
    hover: (item, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      if (item.pageIndex !== pageIndex) return;
      const sameContainer = (item.sectionIndex ?? null) === (sectionIndex ?? null);
      if (!sameContainer) return;
      if (item.index === index) return;
      onReorder(pageIndex, sectionIndex ?? null, item.index, index);
      item.index = index;
    }
  });

  const getIcon = (type) => '📝';
  
  const formatRuleDescription = findDescription(question.formatText, question.attributeType);
  
  // Get the question title - prioritize user's global UI language, then currentLanguage tab, then fallback
  const getQuestionTitle = () => {
    if (typeof question.title === 'object' && question.title !== null) {
      // First try user's global UI language
      const userLanguage = codesToLanguages?.[i18next.language];
      if (userLanguage && question.title[userLanguage]) return question.title[userLanguage];
      
      // Then try the current language tab
      if (currentLanguage && question.title[currentLanguage]) return question.title[currentLanguage];
      
      // Fallback to first available language
      const firstLang = Object.keys(question.title)[0];
      if (firstLang && question.title[firstLang]) return question.title[firstLang];
    }
    return question.title || 'Untitled Question';
  };

  return (
    <Card 
      ref={(node) => drag(drop(node))} 
      sx={{ 
        mb: 1, 
        opacity: isDragging ? 0.5 : 1, 
        cursor: 'move',
        border: `1px solid ${CustomPalette.GREY_300}`,
        '&:hover': {
          boxShadow: 2,
          borderColor: CustomPalette.PRIMARY
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DragIcon sx={{ color: CustomPalette.GREY_600 }} />
          <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>{getIcon(question.formatText)}</Typography>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: CustomPalette.GREY_800 }}>{getQuestionTitle()}</Typography>
            <Typography variant="body2" sx={{ color: CustomPalette.GREY_600 }}>{formatRuleDescription || question.attributeType || 'No format rule'}</Typography>
          </Box>
          <IconButton size="small" onClick={() => onEdit(question, index, pageIndex, sectionIndex)} sx={{ color: CustomPalette.GREY_600 }}>
            <EditIcon />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete(index, pageIndex, sectionIndex)} sx={{ color: CustomPalette.SECONDARY }}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DraggableQuestion;


