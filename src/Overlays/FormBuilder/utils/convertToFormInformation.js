export const convertToFormInformation = (pages) => {
  const formData = [];
  (pages || []).forEach((page) => {
    const collect = (q) => {
      if (!q?.attribute) return;
      formData.push({
        Attribute: q.attribute,
        Label: q.title || q.attribute,
        Placeholder: q.placeholder || '',
        Type: q.type,
        Required: q.required || false,
        Options: q.options || []
      });
    };
    (page.questions || []).forEach(collect);
    (page.sections || []).forEach((s) => (s.questions || []).forEach(collect));
  });
  return formData;
};

// Convert to hierarchical form information overlay structure
export const convertToFormInformationOverlay = (pages, languages = ['eng'], schemaName = {}) => {
  const pagesStructure = [];
  const pageOrder = [];
  const pageLabels = {};
  const sidebarLabel = {};
  const subheading = {};
  const title = {};
  const interaction = [{ arguments: {} }];

  languages.forEach(lang => {
    pageLabels[lang] = {};
    sidebarLabel[lang] = {};
    subheading[lang] = {};
    title[lang] = schemaName[lang] || '';
  });

  pages.forEach((page, pageIdx) => {
    const pageId = page.id || `page-${pageIdx + 1}`;
    pageOrder.push(pageId);

    languages.forEach(lang => {
      pageLabels[lang][pageId] = page.labels?.[lang] || `Page ${pageIdx + 1}`;
      sidebarLabel[lang][pageId] = page.sidebarLabels?.[lang] || `Page ${pageIdx + 1}`;
      subheading[lang][pageId] = page.subheadings?.[lang] || `Page ${pageIdx + 1}`;
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
          subheading[lang][sectionId] = section.subheadings?.[lang] || `Section ${sectionIdx + 1}`;
        });

        section.questions.forEach(q => {
          if (q?.attribute) {
            const attributeType = q.attributeType || q.type;
            const isTextType = attributeType === 'Text' || attributeType === 'Array[Text]';
            
            const placeholderObj = {};
            if (isTextType) {
              languages.forEach(lang => {
                // Extract language-specific placeholder if it's an object, otherwise use the value directly
                if (typeof q.placeholder === 'object' && q.placeholder !== null) {
                  placeholderObj[lang] = q.placeholder[lang] || '';
                } else {
                  placeholderObj[lang] = q.placeholder || '';
                }
              });
            }

            interaction[0].arguments[q.attribute] = {
              type: q.inputType || q.type || 'text',
              attribute_type: attributeType,
              ...(isTextType && Object.keys(placeholderObj).length > 0 && { placeholder: placeholderObj }),
              ...(q.formatText && { format_text: q.formatText }),
              ...(q.required && { required: q.required }),
              ...(q.booleanValues && { boolean_values: q.booleanValues })
            };
            // Note: Entry codes/options are referenced from the OCA bundle's entry and entry_code overlays
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
          const isTextType = attributeType === 'Text' || attributeType === 'Array[Text]';
          
          const placeholderObj = {};
          if (isTextType) {
            languages.forEach(lang => {
              if (typeof q.placeholder === 'object' && q.placeholder !== null) {
                placeholderObj[lang] = q.placeholder[lang] || '';
              } else {
                placeholderObj[lang] = q.placeholder || '';
              }
            });
          }

          interaction[0].arguments[q.attribute] = {
            type: q.inputType || q.type || 'text',
            attribute_type: attributeType,
            ...(isTextType && Object.keys(placeholderObj).length > 0 && { placeholder: placeholderObj }),
            ...(q.formatText && { format_text: q.formatText }),
            ...(q.required && { required: q.required }),
            ...(q.booleanValues && { boolean_values: q.booleanValues })
          };
          // Note: Entry codes/options are referenced from the OCA bundle's entry and entry_code overlays
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
    subheading: subheading,
    interaction: interaction,
    title: title
  };
};


