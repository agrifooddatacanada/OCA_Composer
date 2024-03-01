import React from 'react';
import TypographyTag from '../components/TypographyTag';
import HelpPageH2Title from '../components/HelpPageH2Title';
import HelpPageContainer from '../components/HelpPageContainer';
import CustomAnchorLink from '../components/CustomAnchorLink';

const HelpStorage = () => {
  return (
    <HelpPageContainer>
      <HelpPageH2Title text="Saving, Depositing and/or Publishing your Schema" />
      <TypographyTag>
        You will want to ensure your schema is available for reference and/or reuse. Here are several options:
      </TypographyTag>
      <ul>
        <TypographyTag type='li'>
          You can save your schema together with your data.
        </TypographyTag>
        <TypographyTag type='li'>
          You can deposit your schema together with a dataset when you put your dataset in a repository.
        </TypographyTag>
        <TypographyTag type='li'>
          You can publish your schema separately, where it is given an identifier you can use to associate the schema with your datasets.
        </TypographyTag>
      </ul>

      <p style={{ fontSize: '24px' }}><strong>Save your schema with your data</strong> </p>
      <TypographyTag>
        The first, and easiest way to save your schema for future reference is together with the dataset that it is associated with it. This is most useful for schemas that are very specific to your dataset and where you haven’t created the schema with an eye towards reuse.
      </TypographyTag>
      <br></br>
      <TypographyTag>
        We suggest that you save your schema both as the OCA bundle and the readme plain text file. The OCA bundle is a machine-readable version and is a published standard. This should be the most future-proof version of your schema. The plain text file is a human readable version and uses the simplest technologies making it an excellent choice for archiving.
      </TypographyTag>
      <p style={{ fontSize: '24px' }}><strong>Deposit your schema separately in a repository</strong> </p>
      <TypographyTag>
        Schemas can be written to be useful for multiple datasets. A well written schema can be very useful for a research community because it can make it easier to share and understand data, and save the work of documentation.
      </TypographyTag>
      <br></br>
      <TypographyTag>
        There are many public or institutional repositories that are available for schema deposition. An open public repository would be the <CustomAnchorLink link='https://zenodo.org' text="Zenodo repository" /> operated by CERN. Schemas published here will be assigned a citable DOI.
      </TypographyTag>
      <br></br>
      <TypographyTag>
        If you are employed at the University of Guelph you can deposit a schema separately in the University of Guelph’s Borealis repository and this will give your schema a citable DOI. You can share and publish this DOI and reference it when you publish your data. Other researchers can reference your schema for their own data collection and publication.
      </TypographyTag>
      <br></br>
      <TypographyTag>
        Obtaining a DOI via Borealis:
      </TypographyTag>
      <ol>
        <TypographyTag type='li'>
          <CustomAnchorLink link='https://borealisdata.ca/loginpage.xhtml' text='Log in to Borealis' />, A Canadian Dataverse Repository using your U of G username and password.
        </TypographyTag>
        <TypographyTag type='li'>
          Request permission to deposit in the U of G Research Data Repositories at lib.research@uoguelph.ca.
        </TypographyTag>
        <TypographyTag type='li'>
          Once access has been granted, navigate to the Agri-environmental Research Data Repository - <CustomAnchorLink link='https://borealisdata.ca/dataverse/adcSchema/' text='Agri-food Data Canada – Schemas collection' />.
        </TypographyTag>
        <TypographyTag type='li'>
          Click on ‘Add Data’ button and select ‘New Dataset’ from the drop-down menu.
        </TypographyTag>
        <TypographyTag type='li'>
          In the Dataset Template section, make sure that ‘ADC Schema’ is selected from the drop-down menu.
        </TypographyTag>
        <TypographyTag type='li'>
          In the Citation Metadata section, complete the required information (e.g., title, author, contact, description, keywords, depositor name).
        </TypographyTag>
        <TypographyTag type='li'>
          Under the Files section, drag and drop your OCA Schema Bundle in (*.json) format and the schema in the readme archive format (*.txt) format.
        </TypographyTag>
        <TypographyTag type='li'>
          Click Save Dataset.
          <ul>
            <TypographyTag type='li'>
              After saving the dataset, a DOI is created and reserved for the record.
            </TypographyTag>
          </ul>
        </TypographyTag>
        <TypographyTag type='li'>
          Edit the draft record (e.g., descriptive information (metadata) or files) as required.
        </TypographyTag>
        <TypographyTag type='li'>
          Click on the ‘Publish Dataset’ button and select ‘Submit for Review’.
        </TypographyTag>
        <TypographyTag type='li'>
          Repository staff (at the Library) will review and publish the record.
          <ul>
            <TypographyTag type='li'>
              Upon publication, the DOI is resolved and becomes a working link.
            </TypographyTag>
          </ul>
        </TypographyTag>
      </ol>

      <TypographyTag>
        For reference: Research & Scholarship, 2020, “How to deposit research data in the Agri-environmental Research Data Repository or the University of Guelph Research Data Repository”, https://doi.org/10.5683/SP2/CPHFGA, Borealis
      </TypographyTag>
      <p style={{ fontSize: '20px' }}><strong>Versioning</strong> </p>

      <TypographyTag>
        For <strong>minor updates</strong> (like correcting typos) we recommend that you use the replacement feature of the Repository.
      </TypographyTag>
      <ul>
        <TypographyTag type='li'>
          Use the Replace function. This replaces the file in the record and versions the record.
        </TypographyTag>
        <TypographyTag type='li'>
          Previous versions of the file are still accessible using the Versions tab in the record.
        </TypographyTag>
      </ul>

      <TypographyTag>
        For <strong>major updates</strong> we recommend that you create another DOI and deposit the updated schema there. Add the citation (including DOI) to the original version of the schema into the ‘Related Datasets’ field in the record metadata.
      </TypographyTag>
      <p style={{ fontSize: '24px' }}><strong>OCA Repository</strong> </p>
      <TypographyTag>
        Agri-food Data Canada, together with the Human Colossus Foundation is currently developing a specialized repository for OCA Schema creation.
      </TypographyTag>


    </HelpPageContainer >
  );
};

export default HelpStorage;