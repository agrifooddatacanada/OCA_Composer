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

const removeItemFromPageItemsByQuestionId = (page, questionId) => {
  if (!page.items) return page;
  return {
    ...page,
    items: (page.items || []).filter(
      (it) => !(it.kind === "question" && it.id === questionId)
    )
  };
};

const removeItemFromPageItemsBySectionId = (page, sectionId) => {
  if (!page.items) return page;
  return {
    ...page,
    items: (page.items || []).filter(
      (it) => !(it.kind === "section" && it.id === sectionId)
    )
  };
};

const appendItemToPageItems = (page, item) => ({
  ...page,
  items: [...(page.items || []), item]
});

const reorderArray = (array, fromIndex, toIndex) => {
  const newArray = [...array];
  const [moved] = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, moved);
  return newArray;
};

const ensurePageItems = (page) => {
  if (page.items && Array.isArray(page.items) && page.items.length > 0) {
    return page;
  }

  const sectionItems = (page.sections || []).map((s) => ({ kind: "section", id: s.id }));
  const questionItems = (page.questions || [])
    .filter((q) => !q.sectionId)
    .map((q) => ({ kind: "question", id: q.id }));
  return { ...page, items: [...sectionItems, ...questionItems] };
};

export const reorderPageItems = (pages, pageIndex, fromIndex, toIndex) =>
  pages.map((p, i) => {
    if (i !== pageIndex) return p;
    const page = ensurePageItems(p);
    return { ...page, items: reorderArray(page.items || [], fromIndex, toIndex) };
  });

export const movePageItemToPage = (
  pages,
  fromPageIndex,
  fromIndexInItems,
  toPageIndex
) => {
  const newPages = [...pages];
  const fromPage = ensurePageItems(newPages[fromPageIndex]);
  const [moved] = (fromPage.items || []).splice(fromIndexInItems, 1);
  if (!moved) return newPages;

  const toPage = ensurePageItems(newPages[toPageIndex]);
  newPages[toPageIndex] = { ...toPage, items: [...(toPage.items || []), moved] };

  if (moved.kind === "section") {
    const sectionIndex = (fromPage.sections || []).findIndex((s) => s.id === moved.id);
    if (sectionIndex !== -1) {
      const section = fromPage.sections[sectionIndex];
      fromPage.sections.splice(sectionIndex, 1);
      newPages[toPageIndex].sections.push(section);
    }
  } else if (moved.kind === "question") {
    const qIndex = (fromPage.questions || []).findIndex((q) => q.id === moved.id);
    if (qIndex !== -1) {
      const q = fromPage.questions[qIndex];
      fromPage.questions.splice(qIndex, 1);
      newPages[toPageIndex].questions.push({ ...q, sectionId: null });
    }
  }
  newPages[fromPageIndex] = { ...fromPage };
  return newPages;
};

export const moveQuestionToPage = (
  pages,
  fromPageIndex,
  fromQuestionIndex,
  toPageIndex,
  fromSectionIndex = null
) => {
  // If moving from top-level, try to use movePageItemToPage
  if (fromSectionIndex === null) {
    const fromPage = ensurePageItems(pages[fromPageIndex]);
    const question = fromPage.questions[fromQuestionIndex];
    if (question) {
      const itemIndex = fromPage.items.findIndex(
        (it) => it.kind === "question" && it.id === question.id
      );
      if (itemIndex !== -1) {
        // Move to destination page
        const newPages = movePageItemToPage(pages, fromPageIndex, itemIndex, toPageIndex);
        // Ensure sectionId is null
        const destPage = newPages[toPageIndex];
        const qIndex = destPage.questions.findIndex((q) => q.id === question.id);
        if (qIndex !== -1) {
          newPages[toPageIndex] = {
            ...destPage,
            questions: destPage.questions.map((q, i) =>
              i === qIndex ? { ...q, sectionId: null } : q
            )
          };
        }
        return newPages;
      }
    }
  }
  // Fallback: manual array manipulation (for questions coming from sections or if items lookup fails)
  const newPages = [...pages];
  const question = extractQuestion(
    newPages,
    fromPageIndex,
    fromQuestionIndex,
    fromSectionIndex
  );
  const q = { ...question, sectionId: null };
  newPages[toPageIndex].questions.push(q);
  if (fromSectionIndex === null) {
    const fromPage = newPages[fromPageIndex];
    newPages[fromPageIndex] = removeItemFromPageItemsByQuestionId(fromPage, question.id);
  }
  const toPage = ensurePageItems(newPages[toPageIndex]);
  newPages[toPageIndex] = appendItemToPageItems(toPage, { kind: "question", id: q.id });
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
  // If moved from top-level into a section, remove corresponding page item
  if (fromSectionIndex === null) {
    const fromPage = newPages[fromPageIndex];
    newPages[fromPageIndex] = removeItemFromPageItemsByQuestionId(fromPage, question.id);
  }
  return newPages;
};

export const moveSectionBetweenPages = (
  pages,
  fromPageIndex,
  fromSectionIndex,
  toPageIndex
) => {
  const fromPage = ensurePageItems(pages[fromPageIndex]);
  const section = fromPage.sections[fromSectionIndex];
  if (!section) return pages;
  const itemIndex = fromPage.items.findIndex(
    (it) => it.kind === "section" && it.id === section.id
  );
  if (itemIndex !== -1) {
    return movePageItemToPage(pages, fromPageIndex, itemIndex, toPageIndex);
  }
  const newPages = [...pages];
  newPages[fromPageIndex].sections.splice(fromSectionIndex, 1);
  newPages[fromPageIndex] = removeItemFromPageItemsBySectionId(
    newPages[fromPageIndex],
    section.id
  );
  newPages[toPageIndex].sections.push(section);
  newPages[toPageIndex] = appendItemToPageItems(newPages[toPageIndex], {
    kind: "section",
    id: section.id
  });
  return newPages;
};

export const reorderQuestionInContainer = (
  pages,
  pageIndex,
  sectionIndexOrNull,
  fromIndex,
  toIndex
) => {
  if (sectionIndexOrNull === null) {
    const page = ensurePageItems(pages[pageIndex]);
    const question = page.questions[fromIndex];
    if (!question) return pages;
    const fromItemIndex = page.items.findIndex(
      (it) => it.kind === "question" && it.id === question.id
    );
    const toQuestion = page.questions[toIndex];
    if (!toQuestion) return pages;
    const toItemIndex = page.items.findIndex(
      (it) => it.kind === "question" && it.id === toQuestion.id
    );
    if (fromItemIndex !== -1 && toItemIndex !== -1) {
      return reorderPageItems(pages, pageIndex, fromItemIndex, toItemIndex);
    }
    return pages.map((p, i) => {
      if (i !== pageIndex) return p;
      return { ...p, questions: reorderArray(p.questions || [], fromIndex, toIndex) };
    });
  }
  return pages.map((p, i) => {
    if (i !== pageIndex) return p;
    return {
      ...p,
      sections: p.sections.map((s, si) => {
        if (si !== sectionIndexOrNull) return s;
        return { ...s, questions: reorderArray(s.questions || [], fromIndex, toIndex) };
      })
    };
  });
};

export const reorderSectionInPage = (pages, pageIndex, fromIndex, toIndex) => {
  const page = pages[pageIndex];
  if (!page) return pages;
  const section = (page.sections || [])[fromIndex];
  if (!section) return pages;
  const pageWithItems = ensurePageItems(page);
  const fromItemIndex = pageWithItems.items.findIndex(
    (it) => it.kind === "section" && it.id === section.id
  );
  const toSection = (page.sections || [])[toIndex];
  if (!toSection) return pages;
  const toItemIndex = pageWithItems.items.findIndex(
    (it) => it.kind === "section" && it.id === toSection.id
  );
  if (fromItemIndex === -1 || toItemIndex === -1) {
    return pages.map((p, i) => {
      if (i !== pageIndex) return p;
      return { ...p, sections: reorderArray(p.sections || [], fromIndex, toIndex) };
    });
  }
  return reorderPageItems(pages, pageIndex, fromItemIndex, toItemIndex);
};

export const reorderPages = (pages, fromIndex, toIndex) =>
  reorderArray(pages, fromIndex, toIndex);
