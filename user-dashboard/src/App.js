import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';

import {AuthProvider, useAuth} from './context/AuthContext';
import DashboardPage from './components/DashboardPage';
import SignInPage from './features/auth/SignInPage';
import ContextSelectionPage from './features/auth/ContextSelectionPage';

// Simple wrapper for private routes
const PrivateRoute = ({children}) => {
  const {isAuthenticated, isLoading} = useAuth();

  if (isLoading) {
    return <div>Loading authentication...</div>; // Or a spinner
  }

  return isAuthenticated ? children : <Navigate to="/auth" replace/>;
};

// Main App component
const App = () => {

  // If the user is not authenticated, redirect to login, otherwise show the dashboard
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public route for login */}
          <Route path="/auth">
            {/* Default nested route shows SignInPage */}
            <Route index element={<SignInPage />} />
            {/* Nested route for context selection after sign-in (within client flow) */}
            <Route path="context" element={<ContextSelectionPage />} />
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
                <Navigate to="/dashboard" replace/>
              </PrivateRoute>
            }
          />

          {/* Default route shows 404 page */}
          <Route path="*" element={<div>404: Page Not Found</div>}/>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;