import React from 'react';
import LandingPageContainter from '../components/LandingPageContainer';
import LandingPageH2Title from '../components/LandingPageH2Title';
import TypographyTag from '../components/TypographyTag';

const GuidanceForDesigningDataSets = () => {
  return (
    <LandingPageContainter>
        <LandingPageH2Title text = "Guidance for designing datasets" />
        <TypographyTag>
            Recommendation: Long format of datasets is recommended for schema documentation. 
        </TypographyTag>
        <br></br>
        <TypographyTag>
            Data must help answer specific questions or meet specific goals and that influences the way the data can be represented. For example, analysis often depends on data in a specific format, generally referred to as wide vs long format. Wide datasets are more intuitive and easier to grasp when there are relatively few variables, while long datasets are more flexible and efficient for managing complex, structured data with many variables or repeated measures. Researchers and data analysts often transform data between these formats based on the requirements of their analysis.
        </TypographyTag>
        <br></br>
        <TypographyTag>
           <p style ={{fontSize:'24px'}}><strong>Wide Dataset:</strong> </p>
           <strong>Format: </strong>
           In a wide dataset, each variable or attribute has its own column, and each observation or data point is a single row. This representation is typically seen in Excel.
           <br></br>
           <strong>Structure: </strong> 
           It typically has a broader structure with many columns, making it easier to read and understand when there are relatively few variables.
           <br></br>
           <strong>Use Cases: </strong>
           Wide datasets are often used for summary or aggregated data, and they are suitable for simple statistical operations like means and sums.
           <br></br>
           <br></br>
           For example, here is a dataset in wide format:
           <br></br>
           <br></br>
           <table border="1">
  <thead>
    <tr>
      <th>ID</th>
      <th>TREATMENT</th>
      <th>HT1</th>
      <th>HT2</th>
      <th>HT3</th>
      <th>HT4</th>
      <th>HT5</th>
      <th>HT6</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style={{ textAlign: 'center' }}>01</td>
      <td style={{ textAlign: 'center' }}>A</td>
      <td style={{ textAlign: 'center' }}>12</td>
      <td style={{ textAlign: 'center' }}>18</td>
      <td style={{ textAlign: 'center' }}>19</td>
      <td style={{ textAlign: 'center' }}>26</td>
      <td style={{ textAlign: 'center' }}>34</td>
      <td style={{ textAlign: 'center' }}>55</td>
    </tr>
    <tr>
      <td style={{ textAlign: 'center' }}>02</td>
      <td style={{ textAlign: 'center' }}>A</td>
      <td style={{ textAlign: 'center' }}>10</td>
      <td style={{ textAlign: 'center' }}>15</td>
      <td style={{ textAlign: 'center' }}>19</td>
      <td style={{ textAlign: 'center' }}>24</td>
      <td style={{ textAlign: 'center' }}>30</td>
      <td style={{ textAlign: 'center' }}>45</td>
    </tr>
    <tr>
      <td style={{ textAlign: 'center' }}>03</td>
      <td style={{ textAlign: 'center' }}>B</td>
      <td style={{ textAlign: 'center' }}>11</td>
      <td style={{ textAlign: 'center' }}>16</td>
      <td style={{ textAlign: 'center' }}>20</td>
      <td style={{ textAlign: 'center' }}>25</td>
      <td style={{ textAlign: 'center' }}>32</td>
      <td style={{ textAlign: 'center' }}>50</td>
    </tr>
    <tr>
      <td style={{ textAlign: 'center' }}>04</td>
      <td style={{ textAlign: 'center' }}>B</td>
      <td style={{ textAlign: 'center' }}>9</td>
      <td style={{ textAlign: 'center' }}>11</td>
      <td style={{ textAlign: 'center' }}>14</td>
      <td style={{ textAlign: 'center' }}>22</td>
      <td style={{ textAlign: 'center' }}>38</td>
      <td style={{ textAlign: 'center' }}>42</td>
    </tr>
  </tbody>
</table>

        <br></br>
        <p style ={{fontSize:'24px'}}><strong>Long Dataset:</strong> </p>
        <strong>Format: </strong>
            In a long dataset, there are fewer columns, and the data is organized with multiple rows for each unique combination of variables. Typically, you have columns for "variable," "value," and potentially other categorical identifiers.
           <br></br>
           <strong>Structure: </strong> 
           It is more compact and vertically oriented, making it easier to work with when you have a large number of variables or need to perform complex data transformations..
           <br></br>
           <strong>Use Cases: </strong>
           Long datasets are well-suited for storing and analyzing data with multiple measurements or observations over time or across different categories. They facilitate advanced statistical analyses like regression and mixed-effects modeling. In Excel you can use pivot tables to view summary statistics of long datasets.
           <br></br>
           <br></br>
           For example, here is some of the same data represented in a long format:
           <br></br>
           <br></br>
           <table border="1">
  <thead>
    <tr>
      <th>ID</th>
      <th>TREATMENT</th>
      <th>WEEK</th>
      <th>HEIGHT</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style={{ textAlign: 'center' }}>01</td>
      <td style={{ textAlign: 'center' }}>A</td>
      <td style={{ textAlign: 'center' }}>1</td>
      <td style={{ textAlign: 'center' }}>12</td>
    </tr>
    <tr>
      <td style={{ textAlign: 'center' }}>01</td>
      <td style={{ textAlign: 'center' }}>A</td>
      <td style={{ textAlign: 'center' }}>2</td>
      <td style={{ textAlign: 'center' }}>18</td>
    </tr>
    <tr>
      <td style={{ textAlign: 'center' }}>01</td>
      <td style={{ textAlign: 'center' }}>A</td>
      <td style={{ textAlign: 'center' }}>3</td>
      <td style={{ textAlign: 'center' }}>19</td>
    </tr>
    <tr>
      <td style={{ textAlign: 'center' }}>01</td>
      <td style={{ textAlign: 'center' }}>A</td>
      <td style={{ textAlign: 'center' }}>4</td>
      <td style={{ textAlign: 'center' }}>26</td>
    </tr>
    <tr>
      <td style={{ textAlign: 'center' }}>01</td>
      <td style={{ textAlign: 'center' }}>A</td>
      <td style={{ textAlign: 'center' }}>5</td>
      <td style={{ textAlign: 'center' }}>34</td>
    </tr>
    <tr>
      <td style={{ textAlign: 'center' }}>01</td>
      <td style={{ textAlign: 'center' }}>A</td>
      <td style={{ textAlign: 'center' }}>6</td>
      <td style={{ textAlign: 'center' }}>55</td>
    </tr>
  </tbody>
</table>
<br></br>
Long format data is a better choice when choosing a format to be documented with a schema as it is easier to document and more clear to understand. For example, column headers (attributes) in the wide format are repetitive and this results in duplicated documentation (e.g. HT1 is the height of the subject measured at the end of week 1; HT2 is the height of the subject measured at the end of week 2 etc.). It is also less flexible as each additional week needs an additional column and therefore another attribute described in the schema. This means each time you add a variable you change the structure of the capture base of the schema reducing interoperability.
<br></br>
<br></br>
Documenting a schema in long format is more flexible because it is more general. This makes the schema reusable for other experiments, either by the researcher or by others. It is also easier to reuse the data and combine it with similar experiments.
<br></br>
<br></br>
At the time of analysis, the data can be transformed from long to wide if necessary and many data analysis programs have specialized functions that help researchers with this task.

       
        </TypographyTag>

    </LandingPageContainter >
  );
};

export default GuidanceForDesigningDataSets;