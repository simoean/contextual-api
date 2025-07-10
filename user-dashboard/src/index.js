import React from 'react';
import ReactDOM from 'react-dom/client';

import './assets/styles/global.css';
import {AuthProvider} from 'features/auth/context/AuthContext';

import { ChakraProvider } from '@chakra-ui/react';
import theme from 'shared/theme/theme';

import App from './app/RootApp';
import reportWebVitals from './app/reportWebVitals';

/**
 * Root component
 * This component initializes the application by rendering the main App component
 */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <AuthProvider>
        {/* Main App component */}
        <App/>
      </AuthProvider>
    </ChakraProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example, reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
