import React from 'react';
import HelpPageContainer from '../components/HelpPageContainer';
import HelpPageH2Title from '../components/HelpPageH2Title';
import HelpPageH3Title from '../components/HelpPageH3Title';
import TypographyTag from '../components/TypographyTag';


const CharacterEncodingHelp = () => {
  return (
    <HelpPageContainer>
      <HelpPageH2Title text="Overlays - Character Encoding" />
      <br />
      <HelpPageH3Title text="Character Enconding" />
      <TypographyTag>
        Character Encoding is an optional overlay for your schema where you can specify what character encoding is used by the associated datasets.
        <br></br>
        <br></br>
        Character encoding is a system used in computing to represent characters, symbols, and text in a digital format. It assigns numerical codes (binary values) to each character, allowing computers to store, transmit, and process text data.
        <br></br>
        <br></br>
        Character encoding is essential for computers to correctly encode and decode text in various languages and scripts, ensuring that text displays correctly and consistently across different computer systems and software applications. Common character encoding schemes include ASCII, UTF-8, and UTF-16.
        <br></br>
        <br></br>
        If you are creating a schema for new data collection, UTF-8 is a good choice as it is backwards compatible with ASCII, supported by nearly all modern programming languages and supports internationalization.
        <br></br>
        <br></br>
        If you are using existing data and you know the character encoding used, you can record that information here.
        <br></br>
        <br></br>
        If you don’t know what type of character encoding is used by your data, you can leave this overlay blank.
        <br></br>
        <br></br>
        If you would like a character encoding to be added to the choices, email us at adc@uoguelph.ca
        <br></br>
        <br></br>
      </TypographyTag>
    </HelpPageContainer>
  );
};

export default CharacterEncodingHelp;