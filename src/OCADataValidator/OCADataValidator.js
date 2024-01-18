import Header from "../Header/Header";
import Footer from '../Footer/Footer';
import Drop from "../StartSchema/Drop";
import { useState } from "react";

const OCADataValidator = () => {
  const [rawFile, setRawFile] = useState(null);
  const [secondRawFile, setSecondRawFile] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <Header currentPage="" />
      <Drop
        setFile={setRawFile}
        setLoading={setLoading}
        loading={loading}
      // dropDisabled={dropDisabled}
      // dropMessage={dropMessage}
      // setDropMessage={setDropMessage}
      />
      <Drop
        setFile={setSecondRawFile}
        setLoading={setLoading}
        loading={loading}
      // dropDisabled={dropDisabled}
      // dropMessage={dropMessage}
      // setDropMessage={setDropMessage}
      />
      <Footer currentPage="" />
    </>
  );
};

export default OCADataValidator;