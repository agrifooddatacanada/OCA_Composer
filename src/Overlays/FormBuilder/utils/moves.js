const extractQuestion = (pages, fromPageIndex, fromQuestionIndex, fromSectionIndex) => {
  if (fromSectionIndex !== null) {
    const question =
      pages[fromPageIndex].sections[fromSectionIndex].questions[fromQuestionIndex];
    pages[fromPageIndex].sections[fromSectionIndex].questions.splice(
      fromQuestionIndex,
      1
    );
    return question;
  }
  const question = pages[fromPageIndex].questions[fromQuestionIndex];
  pages[fromPageIndex].questions.splice(fromQuestionIndex, 1);
  return question;
};

export const moveQuestionToPage = (
  pages,
  fromPageIndex,
  fromQuestionIndex,
  toPageIndex,
  fromSectionIndex = null
) => {
  const newPages = [...pages];
  const question = extractQuestion(
    newPages,
    fromPageIndex,
    fromQuestionIndex,
    fromSectionIndex
  );
  newPages[toPageIndex].questions.push({ ...question, sectionId: null });
  return newPages;
};

export const moveQuestionToSection = (
  pages,
  fromPageIndex,
  fromQuestionIndex,
  toPageIndex,
  toSectionIndex,
  fromSectionIndex = null
) => {
  const newPages = [...pages];
  const question = extractQuestion(
    newPages,
    fromPageIndex,
    fromQuestionIndex,
    fromSectionIndex
  );
  const targetSection = newPages[toPageIndex].sections[toSectionIndex];
  targetSection.questions = [...(targetSection.questions || []), { ...question }];
  return newPages;
};

export const moveSectionBetweenPages = (
  pages,
  fromPageIndex,
  fromSectionIndex,
  toPageIndex
) => {
  const newPages = [...pages];
  const section = newPages[fromPageIndex].sections[fromSectionIndex];
  newPages[fromPageIndex].sections.splice(fromSectionIndex, 1);
  newPages[toPageIndex].sections.push(section);
  return newPages;
};

/**
 * Generic reorder utility that moves an item from one index to another in an array
 */
const reorderArray = (array, fromIndex, toIndex) => {
  const newArray = [...array];
  const [moved] = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, moved);
  return newArray;
};

export const reorderQuestionInContainer = (
  pages,
  pageIndex,
  sectionIndexOrNull,
  fromIndex,
  toIndex
) =>
  pages.map((p, i) => {
    if (i !== pageIndex) return p;
    if (sectionIndexOrNull !== null) {
      return {
        ...p,
        sections: p.sections.map((s, si) => {
          if (si !== sectionIndexOrNull) return s;
          return { ...s, questions: reorderArray(s.questions || [], fromIndex, toIndex) };
        })
      };
    }
    return { ...p, questions: reorderArray(p.questions || [], fromIndex, toIndex) };
  });

export const reorderSectionInPage = (pages, pageIndex, fromIndex, toIndex) =>
  pages.map((p, i) => {
    if (i !== pageIndex) return p;
    return { ...p, sections: reorderArray(p.sections || [], fromIndex, toIndex) };
  });
