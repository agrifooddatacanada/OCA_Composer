export const moveQuestionToPage = (pages, fromPageIndex, fromQuestionIndex, toPageIndex, fromSectionIndex = null) => {
  const newPages = [...pages];
  let question;
  if (fromSectionIndex !== null) {
    question = newPages[fromPageIndex].sections[fromSectionIndex].questions[fromQuestionIndex];
    newPages[fromPageIndex].sections[fromSectionIndex].questions.splice(fromQuestionIndex, 1);
  } else {
    question = newPages[fromPageIndex].questions[fromQuestionIndex];
    newPages[fromPageIndex].questions.splice(fromQuestionIndex, 1);
  }
  newPages[toPageIndex].questions.push({ ...question, sectionId: null });
  return newPages;
};

export const moveQuestionToSection = (pages, fromPageIndex, fromQuestionIndex, toPageIndex, toSectionIndex, fromSectionIndex = null) => {
  const newPages = [...pages];
  let question;
  if (fromSectionIndex !== null) {
    question = newPages[fromPageIndex].sections[fromSectionIndex].questions[fromQuestionIndex];
    newPages[fromPageIndex].sections[fromSectionIndex].questions.splice(fromQuestionIndex, 1);
  } else {
    question = newPages[fromPageIndex].questions[fromQuestionIndex];
    newPages[fromPageIndex].questions.splice(fromQuestionIndex, 1);
  }
  const targetSection = newPages[toPageIndex].sections[toSectionIndex];
  targetSection.questions = [...(targetSection.questions || []), { ...question }];
  return newPages;
};

export const moveSectionBetweenPages = (pages, fromPageIndex, fromSectionIndex, toPageIndex) => {
  const newPages = [...pages];
  const section = newPages[fromPageIndex].sections[fromSectionIndex];
  newPages[fromPageIndex].sections.splice(fromSectionIndex, 1);
  newPages[toPageIndex].sections.push(section);
  return newPages;
};

export const reorderQuestionInContainer = (pages, pageIndex, sectionIndexOrNull, fromIndex, toIndex) => {
  return pages.map((p, i) => {
    if (i !== pageIndex) return p;
    if (sectionIndexOrNull !== null) {
      return {
        ...p,
        sections: p.sections.map((s, si) => {
          if (si !== sectionIndexOrNull) return s;
          const newQs = [...(s.questions || [])];
          const [moved] = newQs.splice(fromIndex, 1);
          newQs.splice(toIndex, 0, moved);
          return { ...s, questions: newQs };
        })
      };
    }
    const newQs = [...(p.questions || [])];
    const [moved] = newQs.splice(fromIndex, 1);
    newQs.splice(toIndex, 0, moved);
    return { ...p, questions: newQs };
  });
};



