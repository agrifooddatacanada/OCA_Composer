import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";
import { useDrag } from 'react-dnd';
import { CustomPalette } from "../../constants/customPalette";
import { codesToLanguages } from "../../constants/isoCodes";
import i18next from "i18next";
import { useTranslation } from "react-i18next";

const DraggablePaletteItem = ({ attribute, labels, type, attributeType, placeholders, currentLanguage }) => {
  // Prioritize currentLanguage tab, then user's global UI language, then fallback
  const userLanguage = codesToLanguages?.[i18next.language];
  const displayLabel = 
    labels?.[currentLanguage] || 
    (userLanguage && labels?.[userLanguage]) || 
    labels?.['default'] || 
    attribute;
  
  const [{ isDragging }, drag] = useDrag({
    type: 'palette-question',
    item: { attribute, labels, formatText: type, attributeType, placeholders, source: 'palette' },
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  });
  
  return (
    <Card 
      ref={drag} 
      sx={{ 
        mb: 1, 
        opacity: isDragging ? 0.5 : 1, 
        cursor: 'grab',
        border: `1px solid ${CustomPalette.GREY_300}`,
        '&:hover': {
          boxShadow: 2,
          borderColor: CustomPalette.PRIMARY,
          backgroundColor: CustomPalette.PINK_200
        }
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600, 
            color: CustomPalette.GREY_800,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'normal',
            lineHeight: 1.4
          }}
        >
          {displayLabel}
        </Typography>
        {displayLabel !== attribute && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: CustomPalette.GREY_600,
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'normal',
              display: 'block',
              lineHeight: 1.4
            }}
          >
            {attribute}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const AttributePalette = ({ 
  attributesList, 
  FormInformationRowData, 
  usedAttributes, 
  formatRuleRowData, 
  attributeRowData, 
  lanAttributeRowData, 
  currentLanguage,
  languages 
}) => {
  const { t } = useTranslation();
  
  return (
    <Box sx={{ 
      position: 'sticky', 
      top: '2rem', 
      alignSelf: 'flex-start',
      maxHeight: 'calc(100vh - 4rem)',
      border: `1px solid ${CustomPalette.GREY_300}`, 
      borderRadius: 1, 
      height: 'fit-content', 
      boxShadow: 1 
    }}>
      <Box sx={{ p: 1.5, borderBottom: `1px solid ${CustomPalette.GREY_300}`, backgroundColor: CustomPalette.GREY_200 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: CustomPalette.GREY_800 }}>{t("Attributes")}</Typography>
        <Typography variant="caption" sx={{ color: CustomPalette.GREY_600 }}>{t("Drag into the form")}</Typography>
      </Box>
      <Box sx={{ p: 1.5, maxHeight: 'calc(100vh - 12rem)', overflowY: 'auto' }}>
        {(attributesList || []).filter((attr) => !usedAttributes.has(attr)).map((attr) => {
          // Build multilingual labels and placeholders
          const labels = {};
          const placeholders = {};
          
          (languages || []).forEach(lang => {
            const lanData = lanAttributeRowData?.[lang];
            const langItem = lanData?.find(r => r.Attribute === attr);
            labels[lang] = langItem?.Label || attr;
            placeholders[lang] = langItem?.Placeholder || '';
          });
          
          // Fallback to FormInformationRowData if lanAttributeRowData is empty
          if (Object.keys(labels).length === 0) {
            const base = (FormInformationRowData || []).find((r) => r.Attribute === attr);
            labels['default'] = base?.Label || attr;
            placeholders['default'] = base?.Placeholder || '';
          }
          
          const formatRule = (formatRuleRowData || []).find((r) => r.Attribute === attr);
          const attributeType = (attributeRowData || []).find((r) => r.Attribute === attr)?.Type || '';
          const formatText = formatRule?.FormatText || '';
          
          return (
            <DraggablePaletteItem 
              key={attr} 
              attribute={attr} 
              labels={labels} 
              type={formatText} 
              attributeType={attributeType} 
              placeholders={placeholders}
              currentLanguage={currentLanguage}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default AttributePalette;


