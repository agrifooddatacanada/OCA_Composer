import { useMemo } from "react";

export const useUsedAttributes = (pages) => {
  return useMemo(() => {
    const used = new Set();
    (pages || []).forEach((page) => {
      (page.questions || []).forEach((q) => q?.attribute && used.add(q.attribute));
      (page.sections || []).forEach((s) => (s.questions || []).forEach((q) => q?.attribute && used.add(q.attribute)));
    });
    return used;
  }, [pages]);
};



