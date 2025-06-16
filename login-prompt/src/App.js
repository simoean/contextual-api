import React from 'react';
import './App.css'; // Keep this for basic styling
// import LoginPage from './components/LoginPage'; // We'll create this soon

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Contextual Identity API</h1>
        {/* <LoginPage /> */} {/* We'll uncomment this later */}
        <p>Login prompt will go here.</p>
      </header>
    </div>
  );
}

export default App;