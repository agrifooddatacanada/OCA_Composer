// src/hooks/useFileListener.js
import { useEffect } from 'react';
import { validateOCAJsonFile } from './validateOCAJsonFile';

const useFileListener = (setFile) => {
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'JSON_SCHEMA') {
        try {
          console.log('file received');
          console.log(event.data);

          const validationResult = validateOCAJsonFile(JSON.stringify(event.data.data));

          if (!validationResult.isValid) {
            console.error(validationResult.errorsMessage);
            return;
          }

          // Show warnings if any
          if (validationResult.warnings.length > 0) {
            console.warn("Validation warnings:", validationResult.warnings);
            console.warn(validationResult.warningsMessage);
          }
          // Convert the received data into a File object
          const file = new File(
            [JSON.stringify(event.data.data)],
            'schema.json',
            { type: 'application/json' }
          );
          Object.defineProperty(file, 'path', {
            value: 'oca_bundle.json', // Set the desired path value
            writable: false,
          });
          if (file) {
            setFile([file]); // Wrap in an array if setFile expects an array
          }
        } catch (error) {
          console.error('Error processing postMessage file:', error);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  });
};

export default useFileListener;
