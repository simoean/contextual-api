import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import React from 'react';

import {Flex, Spinner, Text, useColorModeValue} from '@chakra-ui/react';

import {useAuthenticationStore} from 'features/auth/store/authenticationStore';

import DashboardPage from 'features/dashboard/pages/DashboardPage';

import SignInPage from 'features/auth/pages/SignInPage';
import ContextSelectionPage from 'features/auth/pages/ContextSelectionPage';
import SignUpPage from 'features/auth/pages/SignUpPage';
import ConnectDatasourcesPage from "features/auth/pages/ConnectDatasourcesPage";
import AuthCallbackPage from 'features/auth/pages/AuthCallbackPage';

/**
 * PrivateRoute Component
 * This component checks if the user is authenticated before rendering its children.
 *
 * @param children - The child components to render if the user is authenticated.
 * @returns {*|JSX.Element}
 * @constructor
 */
const PrivateRoute = ({children}) => {

  // Use the authentication context to check if the user is authenticated
  const {isAuthenticated, isLoading} = useAuthenticationStore();

  // Color mode values for background and text
  const bgColour = useColorModeValue('gray.50', 'gray.800');
  const textColour = useColorModeValue('gray.800', 'white');

  if (isLoading) {
    return (
      <Flex direction="column" align="center" justify="center" h="100vh" w="100vw" bg={bgColour}>
        <Spinner
          size="xl"
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="brand.500"
        />
        <Text mt={4} fontSize="lg" color={textColour}>Loading authentication...</Text>
      </Flex>
    );
  }

  return isAuthenticated ? children : <Navigate to="/auth" replace/>;
};

/**
 * Main Application Component
 * This component sets up the main routes for the application using React Router.
 *
 * @returns {JSX.Element}
 * @constructor
 */
const App = () => {

  // Get the login function from your AuthContext.
  const {login: authLogin} = useAuthenticationStore();

  /**
   * Callback function passed to SignInPage upon successful login.
   * It receives the authentication payload and delegates to the AuthContext's login function.
   *
   * @param {object} payloadData - The authentication data (token, user info, selected context/attributes).
   */
  const handleSignInSuccess = (payloadData) => {
    console.log("App.js: handleSignInSuccess received authentication payload:", payloadData);
    // Call the login function from AuthContext to update the global authentication state
    authLogin(payloadData);
  };

  return (
    <Router>
      <Routes>
        {/* Public route for authentication flows */}
        <Route path="/auth">
          {/* Default nested route shows SignInPage, passing the handleSignInSuccess callback */}
          <Route index element={<SignInPage onLoginSuccess={handleSignInSuccess}/>}/>
          {/* Nested route for context selection after sign-in (within the client flow) */}
          <Route path="context" element={<ContextSelectionPage/>}/>
          {/* Nested route for user sign-up */}
          <Route path="signup" element={<SignUpPage/>}/>
          {/* Nested route for user data source connections */}
          <Route path="connect" element={<ConnectDatasourcesPage/>}/>
          {/* Nested route for handling OAuth callbacks */}
          <Route path="callback" element={<AuthCallbackPage />} />
        </Route>

        {/* Protected dashboard route */}
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute>
              <DashboardPage/>
            </PrivateRoute>
          }
        />

        {/* Default/Root path redirects based on authentication */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              {/* If authenticated, redirect to the dashboard; otherwise PrivateRoute will redirect to /auth */}
              <Navigate to="/dashboard" replace/>
            </PrivateRoute>
          }
        />

        {/* Catch-all route for unmatched paths */}
        <Route path="*" element={<div>404: Page Not Found</div>}/>
      </Routes>
    </Router>
  );
}

export default App;