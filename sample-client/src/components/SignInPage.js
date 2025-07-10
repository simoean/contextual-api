import React, {useState} from 'react';
import axios from 'axios';

function SignInPage({onLoginSuccess}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const openLoginPrompt = () => {

    // Unique identifier for this client
    const CLIENT_ID = "sample-client-app";
    const REDIRECT_URI = window.location.origin;

    const loginPromptUrl = 'http://localhost:3000';
    const loginPromptParams = `/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    // Define the desired width and height for the popup
    const width = 600;
    const height = 800;

    // Calculate the center position
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    // Construct the features string
    const features = `width=${width},height=${height},left=${left},top=${top},popup=yes,menubar=no,toolbar=no,location=no,status=no`;

    console.log(`Opening login prompt at ${loginPromptUrl}`);
    const loginWindow = window.open(loginPromptUrl + loginPromptParams, '_blank', features);


    // Add a listener for messages from the opened window (your login-prompt)
    const messageListener = (event) => {
      console.log("sample-client SignInPage: Message received!");
      console.log("sample-client SignInPage: Event origin:", event.origin);
      console.log("sample-client SignInPage: Event data:", event.data);

      // Crucial: Check if the message comes from the expected origin
      if (event.origin !== loginPromptUrl) {
        console.warn(`sample-client SignInPage: Message from unexpected origin: ${event.origin}`);
        return; // Ignore messages from other origins
      }

      // Check if the message indicates a successful login and contains the payload
      if (event.data && event.data.type === 'LOGIN_SUCCESS') {
        const { token, userId, username, selectedContext, contextualAttributes } = event.data; // <--- Access data directly

        console.log("sample-client SignInPage: LOGIN_SUCCESS payload received");
        onLoginSuccess({
          token,
          userId,
          username,
          selectedContext,
          contextualAttributes
        });
        if (loginWindow && !loginWindow.closed) {
          loginWindow.close();
        }
        window.removeEventListener('message', messageListener); // Clean up listener
      } else {
        console.log("sample-client SignInPage: Message type not LOGIN_SUCCESS or payload missing.");
      }
    };

    // Make sure the listener is added ONLY ONCE
    // You might want to remove this listener on component unmount
    window.addEventListener('message', messageListener);
  };

  const handleDirectLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        username,
        password,
      });
      console.log('Direct login successful:', response.data);
      // For direct login, we simulate context selection immediately for display
      // In a real scenario, a direct login might also redirect to a context selection flow on the sample client side
      // For now, let's assume a default "Personal" context for direct login
      const defaultPersonalContextId = 'ctx-pers'; // Assuming this ID for john.doe's personal context
      const directLoginUserInfo = {
        userId: response.data.userId,
        username: response.data.username,
        selectedContext: {
          id: defaultPersonalContextId,
          name: "Personal",
          description: "Default personal context for direct login."
        }, // Mock a selected context
        contextualAttributes: [] // Will fetch these in App.js after this
      };
      // Fetch attributes after direct login to ensure display
      const base64Credentials = btoa(`${username}:password`);
      const authHeader = {'Authorization': `Basic ${base64Credentials}`};
      const attrResponse = await axios.get(
        `http://localhost:8080/api/users/me/attributes/${defaultPersonalContextId}`,
        {headers: authHeader}
      );
      directLoginUserInfo.contextualAttributes = attrResponse.data;
      onLoginSuccess(directLoginUserInfo); // Pass full info to App.js

    } catch (err) {
      console.error('Direct login error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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