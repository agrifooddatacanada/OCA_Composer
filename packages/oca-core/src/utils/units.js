import Fuse from "fuse.js";
import ucumUnits from "../constants/ucumUnits";

export const ucumSearchOptions = {
  keys: ["code", "label", "description"],
  isCaseSensitive: true,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 1,
  shouldSort: true,
  threshold: 0.4,
  distance: 100
};

let _fuseInstance = null;
const getFuseInstance = () => {
  if (!_fuseInstance) {
    _fuseInstance = new Fuse(ucumUnits, ucumSearchOptions);
  }
  return _fuseInstance;
};

let _ucumCodeMap = null;
const getUcumCodeMap = () => {
  if (!_ucumCodeMap) {
    _ucumCodeMap = new Map();
    for (const u of ucumUnits) {
      if (u?.code && !_ucumCodeMap.has(u.code)) {
        _ucumCodeMap.set(u.code, u);
      }
    }
  }
  return _ucumCodeMap;
};

const _searchCache = new Map();
const SEARCH_CACHE_LIMIT = 200;

export const searchUnits = (unit) => {
  if (!unit) return { firstMatch: null, results: [] };

  if (_searchCache.has(unit)) {
    return _searchCache.get(unit);
  }

  const exact = getUcumCodeMap().get(unit);
  if (exact) {
    const result = { firstMatch: exact, results: [exact] };
    if (_searchCache.size >= SEARCH_CACHE_LIMIT) _searchCache.clear();
    _searchCache.set(unit, result);
    return result;
  }

  const fuse = getFuseInstance();
  const searchResults = fuse.search(unit);
  const slicedResults = searchResults.slice(0, 20).map((result) => result.item);

  const uniqueResults = Array.from(new Set(slicedResults.map((item) => item.code))).map(
    (code) => slicedResults.find((item) => item.code === code)
  );

  const result = {
    firstMatch: uniqueResults[0] || null,
    results: uniqueResults
  };
  if (_searchCache.size >= SEARCH_CACHE_LIMIT) _searchCache.clear();
  _searchCache.set(unit, result);
  return result;
};
