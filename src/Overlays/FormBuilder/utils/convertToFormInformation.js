export const convertToFormInformation = (pages) => {
  const formData = [];
  (pages || []).forEach((page) => {
    const collect = (q) => {
      if (!q?.attribute) return;
      const hasOptions = q.options && Array.isArray(q.options) && q.options.length > 0;
      formData.push({
        Attribute: q.attribute,
        Label: q.title || q.attribute,
        Placeholder: q.placeholder || '',
        Type: q.type,
        Required: q.required || false,
        Options: q.options || [],
        ...(hasOptions && q.inputType && { InputType: q.inputType })
      });
    };
    (page.questions || []).forEach(collect);
    (page.sections || []).forEach((s) => (s.questions || []).forEach(collect));
  });
  return formData;
};


export const convertToFormInformationOverlay = (pages, languages = ['eng'], schemaName = {}) => {
  const pagesStructure = [];
  const pageOrder = [];
  const pageLabels = {};
  const sidebarLabel = {};
  const description = {};
  const title = {};
  const interaction = [{ arguments: {} }];

  languages.forEach(lang => {
    pageLabels[lang] = {};
    sidebarLabel[lang] = {};
    description[lang] = {};
    title[lang] = schemaName[lang] || '';
  });

  pages.forEach((page, pageIdx) => {
    const pageId = page.id || `page-${pageIdx + 1}`;
    pageOrder.push(pageId);

    languages.forEach(lang => {
      pageLabels[lang][pageId] = page.labels?.[lang] || `Page ${pageIdx + 1}`;
      sidebarLabel[lang][pageId] = page.sidebarLabels?.[lang] || `Page ${pageIdx + 1}`;
      description[lang][pageId] = page.descriptions?.[lang] || `Page ${pageIdx + 1}`;
    });

    const pageStructure = {
      named_section: pageId,
      attribute_order: []
    };

    (page.sections || []).forEach((section, sectionIdx) => {
      const sectionId = section.id || `section-${sectionIdx + 1}`;
      const sectionQuestions = (section.questions || []).map(q => q.attribute).filter(Boolean);

      if (sectionQuestions.length > 0) {
        pageStructure.attribute_order.push({
          named_section: sectionId,
          attribute_order: sectionQuestions
        });

        languages.forEach(lang => {
          pageLabels[lang][sectionId] = section.labels?.[lang] || `Section ${sectionIdx + 1}`;
          description[lang][sectionId] = section.descriptions?.[lang] || `Section ${sectionIdx + 1}`;
        });

        section.questions.forEach(q => {
          if (q?.attribute) {
            const attributeType = q.attributeType || q.type;
            const isBooleanType = attributeType === 'Boolean' || attributeType === 'Array[Boolean]';
            const isTextType = attributeType === 'Text' || attributeType === 'Array[Text]';
            const isNumericType = attributeType === 'Numeric' || attributeType === 'Array[Numeric]';
            const isDateTimeType = attributeType === 'DateTime' || attributeType === 'Array[DateTime]';
            
            const placeholderObj = {};
            const supportsPlaceholder = isTextType || isNumericType || isDateTimeType;
            if (supportsPlaceholder) {
              languages.forEach(lang => {
                if (typeof q.placeholder === 'object' && q.placeholder !== null) {
                  placeholderObj[lang] = q.placeholder[lang] || '';
                } else {
                  placeholderObj[lang] = q.placeholder || '';
                }
              });
            }

            // For Boolean types, include the selected boolean value options (default to ['True', 'False'])
            const booleanOptions = isBooleanType ? (q.booleanValues || ['True', 'False']) : null;
            
            const hasOptions = q.options && Array.isArray(q.options) && q.options.length > 0;

            interaction[0].arguments[q.attribute] = {
              type: attributeType,
              ...(supportsPlaceholder && Object.keys(placeholderObj).length > 0 && { placeholder: placeholderObj }),
              ...(booleanOptions && { options: booleanOptions }),
              ...(hasOptions && q.inputType && { input_type: q.inputType })
            };
          }
        });
      }
    });

    // Process direct page questions (not in sections)
    const directQuestions = (page.questions || [])
      .filter(q => !q.sectionId)
      .map(q => q.attribute)
      .filter(Boolean);

    if (directQuestions.length > 0) {
      pageStructure.attribute_order.push(...directQuestions);

      page.questions.forEach(q => {
        if (q?.attribute && !q.sectionId) {
          const attributeType = q.attributeType || q.type;
          const isBooleanType = attributeType === 'Boolean' || attributeType === 'Array[Boolean]';
          const isTextType = attributeType === 'Text' || attributeType === 'Array[Text]';
          const isNumericType = attributeType === 'Numeric' || attributeType === 'Array[Numeric]';
          const isDateTimeType = attributeType === 'DateTime' || attributeType === 'Array[DateTime]';
          
          const placeholderObj = {};
          const supportsPlaceholder = isTextType || isNumericType || isDateTimeType;
          if (supportsPlaceholder) {
            languages.forEach(lang => {
              if (typeof q.placeholder === 'object' && q.placeholder !== null) {
                placeholderObj[lang] = q.placeholder[lang] || '';
              } else {
                placeholderObj[lang] = q.placeholder || '';
              }
            });
          }

          // For Boolean types, include the selected boolean value options (default to ['True', 'False'])
          const booleanOptions = isBooleanType ? (q.booleanValues || ['True', 'False']) : null;
          
          const hasOptions = q.options && Array.isArray(q.options) && q.options.length > 0;

          interaction[0].arguments[q.attribute] = {
            type: attributeType,
            ...(supportsPlaceholder && Object.keys(placeholderObj).length > 0 && { placeholder: placeholderObj }),
            ...(booleanOptions && { options: booleanOptions }),
            ...(hasOptions && q.inputType && { input_type: q.inputType })
          };
        }
      });
    }

    pagesStructure.push(pageStructure);
  });

  return {
    pages: pagesStructure,
    page_order: pageOrder,
    page_labels: pageLabels,
    sidebar_label: sidebarLabel,
    description: description,
    interaction: interaction,
    title: title
  };
};


