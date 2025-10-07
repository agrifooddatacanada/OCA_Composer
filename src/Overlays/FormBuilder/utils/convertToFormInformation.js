// Legacy conversion for backward compatibility
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
export const convertToFormInformationOverlay = (pages, languages = ['eng']) => {
  const pagesStructure = [];
  const pageOrder = [];
  const pageLabels = {};
  const sidebarLabel = {};
  const subheading = {};
  const interaction = [{ arguments: {} }];

  // Initialize language objects
  languages.forEach(lang => {
    pageLabels[lang] = {};
    sidebarLabel[lang] = {};
    subheading[lang] = {};
  });

  pages.forEach((page, pageIdx) => {
    const pageId = page.id || `page-${pageIdx + 1}`;
    pageOrder.push(pageId);

    // Set page labels - use user-provided multilingual labels or fall back to defaults
    languages.forEach(lang => {
      pageLabels[lang][pageId] = page.labels?.[lang] || `Page ${pageIdx + 1}`;
      sidebarLabel[lang][pageId] = page.sidebarLabels?.[lang] || `Page ${pageIdx + 1}`;
      subheading[lang][pageId] = page.subheadings?.[lang] || `Page ${pageIdx + 1}`;
    });

    const pageStructure = {
      named_section: pageId,
      attribute_order: []
    };

    // Process sections
    (page.sections || []).forEach((section, sectionIdx) => {
      const sectionId = section.id || `section-${sectionIdx + 1}`;
      const sectionQuestions = (section.questions || []).map(q => q.attribute).filter(Boolean);

      if (sectionQuestions.length > 0) {
        pageStructure.attribute_order.push({
          named_section: sectionId,
          attribute_order: sectionQuestions
        });

        // Set section labels - use user-provided multilingual labels or fall back to defaults
        languages.forEach(lang => {
          pageLabels[lang][sectionId] = section.labels?.[lang] || `Section ${sectionIdx + 1}`;
          subheading[lang][sectionId] = section.subheadings?.[lang] || `Section ${sectionIdx + 1}`;
        });

        // Add question interactions
        section.questions.forEach(q => {
          if (q?.attribute) {
            interaction[0].arguments[q.attribute] = {
              type: q.type || 'text',
              placeholder: {}
            };
            languages.forEach(lang => {
              interaction[0].arguments[q.attribute].placeholder[lang] = q.placeholder || '';
            });
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

      // Add question interactions
      page.questions.forEach(q => {
        if (q?.attribute && !q.sectionId) {
          interaction[0].arguments[q.attribute] = {
            type: q.type || 'text',
            placeholder: {}
          };
          languages.forEach(lang => {
            interaction[0].arguments[q.attribute].placeholder[lang] = q.placeholder || '';
          });
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
    interaction: interaction
  };
};


