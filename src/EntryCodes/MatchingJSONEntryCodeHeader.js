import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import { Context } from '../App';

const MatchingJSONEntryCodeHeader = () => {
  const { tempEntryCodeSummary, tempEntryList } = useContext(Context);
  const [languageList, setLanguageList] = useState([]);
  const [attributeList, setAttributeList] = useState([]);

  useEffect(() => {
    setAttributeList(Object.keys(tempEntryCodeSummary?.['attribute_entry_codes']));
    setLanguageList(tempEntryList.map((entry) => entry?.language));
  }, []);

  console.log('tempEntryCodeSummary', tempEntryCodeSummary);
  console.log('tempEntryList', tempEntryList);
  console.log('languageList', languageList);
  console.log('attributeList', attributeList);

  return (
    <div>MatchingJSONEntryCodeHeader</div>
  );
};

export default MatchingJSONEntryCodeHeader;