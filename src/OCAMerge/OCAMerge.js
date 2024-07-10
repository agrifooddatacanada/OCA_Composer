import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import UploadingStart from './UploadingStart';
import UserSelection from './UserSelection';

const OCAMerge = ({ currentOCAMergePage }) => {
  return (
    <>
      <Header currentPage={currentOCAMergePage} />
      {
        currentOCAMergePage === 'StartOCAMerge' && <UploadingStart />
      }
      {
        currentOCAMergePage === 'UserSelection' && <UserSelection />
      }
      <Footer currentPage={currentOCAMergePage} />
    </>
  );
};

export default OCAMerge;