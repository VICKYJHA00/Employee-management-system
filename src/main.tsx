// Importing necessary libraries and components
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Function to initialize and render the React application
function initializeApp(): void {
  // Get the root DOM element
  const container: HTMLElement | null = document.getElementById('root');

  // Check if the root element exists
  if (!container) {
    throw new Error("Root element with id 'root' not found in the DOM.");
  }

  // Create a React root
  const root: Root = createRoot(container);

  // Render the App component inside React.StrictMode
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Call the initialization function
initializeApp();
