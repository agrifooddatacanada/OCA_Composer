import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, Box, Typography, IconButton, Collapse, Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useDrag, useDrop } from 'react-dnd';
import { DragIndicator as DragIcon, Edit as EditIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import { CustomPalette } from "../../constants/customPalette";
import { FORM_BUILDER_CARD_WIDTH, isChildSchemaType } from "../../constants/constants";
import {
  formatCodeBinaryDescription,
  formatCodeDateDescription,
  formatCodeNumericDescription,
  formatCodeTextDescription
} from "../../constants/constants";
import QuestionAnswerPreview from "./QuestionAnswerPreview";
import getMultilingualText from "./utils/getMultilingualText";
import { textWrapStyle } from "../../constants/styles";
import DND_TYPES from './dnd/types';

import { getFormatRuleDescription } from "../../utils/helpers";

const findDescription = (formatText, attributeType, t) => {
  return getFormatRuleDescription(attributeType, formatText, t) || "";
};

const DraggableQuestion = ({ question, index, pageIndex, sectionIndex, currentLanguage, onEdit, onDelete, onReorder, indexInItems, onReorderPageItem }) => {
  const { t } = useTranslation();
  const ref = React.useRef(null);
  const [expanded, setExpanded] = React.useState(true);
  const isTopLevel = (sectionIndex ?? null) === null;
  const [{ isDragging }, drag] = useDrag({ type: isTopLevel ? DND_TYPES.PAGE_ITEM : DND_TYPES.QUESTION, item: isTopLevel ? { type: DND_TYPES.PAGE_ITEM, kind: 'question', index, indexInItems, question, pageIndex, sectionIndex } : { type: DND_TYPES.QUESTION, index, question, pageIndex, sectionIndex }, collect: (m) => ({ isDragging: m.isDragging() }) });
  const [{ }, drop] = useDrop({
    accept: isTopLevel ? [DND_TYPES.PAGE_ITEM] : [DND_TYPES.QUESTION],
    canDrop: (item) => {
      if (!isTopLevel) {
        return item.pageIndex === pageIndex && (item.sectionIndex ?? null) === (sectionIndex ?? null) && item.index !== index;
      }
      return item.pageIndex === pageIndex && item.indexInItems !== indexInItems;
    },
    drop: (item, monitor) => {
      if (!isTopLevel && !monitor.didDrop()) {
        const sameContainer = (item.sectionIndex ?? null) === (sectionIndex ?? null);
        if (sameContainer && item.index !== index) {
          onReorder(pageIndex, sectionIndex ?? null, item.index, index);
        }
      }
    },
    hover: (item, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      if (item.pageIndex !== pageIndex) return;
      if (!isTopLevel) {
        const sameContainer = (item.sectionIndex ?? null) === (sectionIndex ?? null);
        if (!sameContainer) return;
        if (item.index === index) return;
        if (ref.current) {
          const hoverBoundingRect = ref.current.getBoundingClientRect();
          const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
          const clientOffset = monitor.getClientOffset();
          if (clientOffset) {
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            if (item.index < index && hoverClientY < hoverMiddleY) return;
            if (item.index > index && hoverClientY > hoverMiddleY) return;
          }
        }
        onReorder(pageIndex, sectionIndex ?? null, item.index, index);
        item.index = index;
        return;
      }
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
  });

  
  const formatRuleDescription = findDescription(question.formatText, question.attributeType, t);
  const questionTitle = getMultilingualText(question.title, currentLanguage, question.attribute || 'Untitled Question');
  const questionDescription = getMultilingualText(question.description, currentLanguage, '');
  const isLongDescription = questionDescription && questionDescription.length > 180;
  const [descExpanded, setDescExpanded] = React.useState(false);
  const isChildSchema = isChildSchemaType(question.attributeType);

  return (
    <Card 
      ref={(node) => { ref.current = node; drag(drop(node)); }} 
      sx={{ 
        mb: 1, 
        opacity: isDragging ? 0.5 : 1, 
        cursor: 'move',
        border: `1px solid ${CustomPalette.GREY_300}`,
        '&:hover': {
          boxShadow: 2,
          borderColor: CustomPalette.PRIMARY
        },
        width: '100%',
        maxWidth: `${FORM_BUILDER_CARD_WIDTH}px`,
        flexShrink: 0
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <DragIcon sx={{ color: CustomPalette.GREY_600, mt: 0.5, flexShrink: 0 }} />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ position: 'relative', mb: 0, width: '100%' }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: CustomPalette.GREY_800, 
                  textAlign: 'center',
                  px: 9,
                  ...textWrapStyle
                }}
              >
                {questionTitle}
              </Typography>
              <Box sx={{ position: 'absolute', top: -4, right: 0, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {/* <IconButton 
                  size="small" 
                  onClick={() => setExpanded(!expanded)}
                  sx={{ 
                    color: CustomPalette.GREY_600,
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s'
                  }}
                >
                  <ExpandMoreIcon fontSize="small" />
                </IconButton> */}
                <IconButton size="small" onClick={() => onEdit(question, index, pageIndex, sectionIndex)} sx={{ color: CustomPalette.GREY_600 }}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(index, pageIndex, sectionIndex)} sx={{ color: CustomPalette.SECONDARY }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {questionDescription && (
              <Box sx={{ mb: 1 }}>
                <Collapse 
                  in={descExpanded || !isLongDescription} 
                  collapsedSize={isLongDescription ? 56 : undefined}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ display: 'block', whiteSpace: 'normal', wordBreak: 'break-word', textAlign: 'left' }}
                  >
                    {questionDescription}
                  </Typography>
                </Collapse>
                {isLongDescription && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => setDescExpanded(!descExpanded)}
                      sx={{ 
                        color: CustomPalette.GREY_600,
                        transform: descExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}
                      aria-label={descExpanded ? 'Collapse instructions' : 'Expand instructions'}
                    >
                      <ExpandMoreIcon fontSize="small" />
                    </IconButton>
                    <Typography 
                      variant="caption" 
                      onClick={() => setDescExpanded(!descExpanded)}
                      sx={{ color: CustomPalette.GREY_600, cursor: 'pointer', userSelect: 'none' }}
                    >
                      {descExpanded ? 'Show less' : 'Show more'}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mb: 1, mt: 0.5 }}>
              <Typography variant="body2" sx={{ color: CustomPalette.GREY_600 }}>
                {formatRuleDescription || (question.attributeType ? t(question.attributeType) : t("No format rule"))}
              </Typography>
              {isChildSchema && (
                <Tooltip title={t("Navigate to the child schema's form overlay to see child schema questions.")} placement="top" arrow>
                  <HelpOutlineIcon sx={{ fontSize: 15, color: CustomPalette.GREY_600 }} />
                </Tooltip>
              )}
            </Box>

            {!isChildSchema && (
            <Collapse in={expanded}>
              <Box sx={{ 
                p: 2, 
                backgroundColor: CustomPalette.GREY_50, 
                borderRadius: 1,
                border: `1px solid ${CustomPalette.GREY_200}`
              }}>
                <Typography variant="caption" sx={{ color: CustomPalette.GREY_600, fontWeight: 600, mt: -1, mb: 1, display: 'block', textAlign: 'center' }}>
                  {t("Answer Area Preview")}:
                </Typography>
                <QuestionAnswerPreview 
                  question={question} 
                  currentLanguage={currentLanguage}
                  compact={false}
                />
              </Box>
            </Collapse>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DraggableQuestion;


