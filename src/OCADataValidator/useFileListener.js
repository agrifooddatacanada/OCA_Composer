// src/hooks/useFileListener.js
import { useEffect } from 'react';

const useFileListener = (setFile) => {
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'JSON_SCHEMA') {
        try {
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
