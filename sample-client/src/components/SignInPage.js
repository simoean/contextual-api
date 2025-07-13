import React, {useState} from 'react';

/**
 * SignInPage Component
 * This component provides a sign-in interface for users to log in directly or via a contextual identity API.
 *
 * @param {function} onLoginSuccess - Callback function to handle successful login.
 * @returns {JSX.Element}
 * @constructor
 */
const SignInPage = ({onLoginSuccess}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Function to open the login prompt in a popup window.
   */
  const openLoginPrompt = () => {

    // Unique identifier for this client
    const CLIENT_ID = "sample-client-app";
    const REDIRECT_URI = window.location.origin;

    const loginPromptUrl = 'http://localhost:3000';
    const loginPromptParams = `/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    // Define the desired width and height for the popup
    const width = 600;
    const height = 1000;

    // Calculate the center position
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    // Construct the features string
    const features = `width=${width},height=${height},left=${left},top=${top},popup=yes,menubar=no,toolbar=no,location=no,status=no`;

    console.log(`Opening login prompt at ${loginPromptUrl}`);
    const loginWindow = window.open(loginPromptUrl + loginPromptParams, '_blank', features);


    // Add a listener for messages from the sign-in window
    const messageListener = (event) => {
      console.log("sample-client SignInPage: Message received!");
      console.log("sample-client SignInPage: Event origin:", event.origin);
      console.log("sample-client SignInPage: Event data:", event.data);

      // Check if the message comes from the expected origin
      if (event.origin !== loginPromptUrl) {
        console.warn(`sample-client SignInPage: Message from unexpected origin: ${event.origin}`);
        return;
      }

      // Check if the message indicates a successful login and contains the payload
      if (event.data && event.data.type === 'CONTEXT_AUTH_SUCCESS') {
        const { token, userId, username, selectedContext, selectedAttributes } = event.data.payload;

        console.log("sample-client SignInPage: CONTEXT_AUTH_SUCCESS payload received");
        onLoginSuccess({
          token,
          userId,
          username,
          selectedContext,
          selectedAttributes
        });
        if (loginWindow && !loginWindow.closed) {
          loginWindow.close();
        }
        window.removeEventListener('message', messageListener);
      } else {
        console.log("sample-client SignInPage: Message type not CONTEXT_AUTH_SUCCESS or payload missing.");
      }
    };

    window.addEventListener('message', messageListener);
  };

  // Handle direct login (mock implementation)
  const handleDirectLogin = async () => {
    alert("Mock Direct Login: This would send a sign in request to the client!");
  };

  // Handle Google login (mock implementation)
  const handleGoogleLogin = () => {
    alert("Mock Google Login: This would redirect to Google's OAuth flow!");
  };

  return (
    <div className="sign-in-container">
      <h2>Sign In to Our App</h2>

      <form onSubmit={handleDirectLogin} className="direct-login-form">
        <h3>Direct Login</h3>
        <div className="form-group">
          <label htmlFor="direct-username">Username:</label>
          <input
            type="text"
            id="direct-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="direct-password">Password:</label>
          <input
            type="password"
            id="direct-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging In...' : 'Login Directly'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>

      <div className="separator">OR</div>

      <h3>Login via Provider</h3>
      <button onClick={openLoginPrompt} className="custom-login-button">
        Login with Contextual Identity API
      </button>
      <button onClick={handleGoogleLogin} className="mock-google-button">
        Login with Google (Mock)
      </button>

      <p className="note-text">
        The "Contextual Identity API" button opens a new window for secure login.
      </p>
    </div>
  );
}

export default SignInPage;