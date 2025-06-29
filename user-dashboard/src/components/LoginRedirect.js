import React from 'react';

function LoginRedirect({ onLoginSuccess }) {

  // Function to check if the user is already authenticated
  const openLoginPrompt = () => {

    // Add a query parameter to indicate this request comes from the dashboard
    const loginPromptUrl = 'http://localhost:3000?mode=dashboard';
    const width = 800;
    const height = 1000;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    const features = `width=${width},height=${height},left=${left},top=${top},popup=yes,menubar=no,toolbar=no,location=no,status=no`;

    const loginWindow = window.open(loginPromptUrl, '_blank', features);

    // Ensure the login-prompt can communicate back to this window
    const messageListener = (event) => {
      if (event.origin !== 'http://localhost:3000') {
        console.warn(`LoginRedirect: Message from unexpected origin: ${event.origin}`);
        return;
      }

      // The login-prompt will now send a 'LOGIN_SUCCESS_DASHBOARD' type message
      if (event.data && event.data.type === 'LOGIN_SUCCESS_DASHBOARD' && event.data.userInfo) {
        console.log("LoginRedirect: LOGIN_SUCCESS_DASHBOARD received:", event.data.userInfo);
        onLoginSuccess(event.data.userInfo);
        if (loginWindow && !loginWindow.closed) {
          loginWindow.close();
        }
        window.removeEventListener('message', messageListener);
      }
    };

    window.addEventListener('message', messageListener);
  };

  // Render the login prompt button
  return (
    <div className="dashboard-container">
      <h2>Access Your Dashboard</h2>
      <p>Please log in to manage your contextual identities.</p>
      <button onClick={openLoginPrompt}>Login to Dashboard</button>
    </div>
  );
}

export default LoginRedirect;