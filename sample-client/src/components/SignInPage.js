import React, {useState, useEffect} from 'react';
import {ExternalLink, XCircle, AlertCircle} from 'lucide-react';

/**
 * SignInPage Component
 * This component provides a sign-in interface.
 *
 * @param {function} onLoginSuccess - Callback function to handle successful login.
 * @param {object} currentClient - The currently selected client object.
 * @param {function} loginUserApi - The API function to call the login endpoint.
 * @returns {JSX.Element}
 * @constructor
 */
const SignInPage = ({onLoginSuccess, currentClient, loginUserApi}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showMessage = (text, type = 'error') => {
    setMessage({ text, type });
  };

  /**
   * Function to open the login prompt in a popup window.
   */
  const openLoginPrompt = () => {

    // Unique identifier for this client
    const CLIENT_ID = currentClient.id;
    const REDIRECT_URI = window.location.origin;

    const loginPromptUrl = 'http://localhost:3000'; // Assuming the login-prompt is on this URL
    const loginPromptParams = `/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    const width = 600;
    const height = 1000;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    const features = `width=${width},height=${height},left=${left},top=${top},popup=yes,menubar=no,toolbar=no,location=no,status=no`;

    console.log(`Opening login prompt for client: ${CLIENT_ID} at ${loginPromptUrl}`);
    const loginWindow = window.open(loginPromptUrl + loginPromptParams, '_blank', features);

    if (!loginWindow || loginWindow.closed || typeof loginWindow.closed === 'undefined') {
      showMessage('Popup blocked! Please enable popups for this site.', 'error');
      return;
    }

    const messageListener = (event) => {
      console.log("SignInPage: Message received!");

      if (event.origin !== loginPromptUrl) {
        console.warn(`SignInPage: Message from unexpected origin: ${event.origin}`);
        return;
      }

      if (event.data && event.data.type === 'CONTEXT_AUTH_SUCCESS') {
        const { token, userId, username, selectedContext, selectedAttributes } = event.data.payload;

        console.log("SignInPage: CONTEXT_AUTH_SUCCESS payload received");
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
        console.log("SignInPage: Message type not CONTEXT_AUTH_SUCCESS or payload missing.");
      }
    };

    window.addEventListener('message', messageListener);
  };

  const handleDirectLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payloadData = await loginUserApi(username, password, currentClient.id);
      onLoginSuccess(payloadData);
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error('Direct Login Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    showMessage("Mock Google Login: This would redirect to Google's OAuth flow!");
  };

  return (
    <div className="sign-in-container">
      {message && (
        <div className={`message-box message-box-${message.type}`}>
          {message.type === 'error' ? <XCircle className="icon" /> : <AlertCircle className="icon" />}
          <p>{message.text}</p>
        </div>
      )}
      <div className="client-info">
        {currentClient.icon}
        <h3>Login to {currentClient.name}</h3>
      </div>
      <form onSubmit={handleDirectLogin} className="direct-login-form">
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
        <button type="submit" disabled={loading} className="main-button">
          {loading ? 'Logging In...' : 'Login Directly'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>

      <div className="separator">OR</div>

      <button onClick={openLoginPrompt} className="custom-login-button">
        Login with Contextual Identity API <ExternalLink className="icon" />
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
