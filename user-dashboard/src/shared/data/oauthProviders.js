import {FaGoogle, FaFacebook, FaLinkedin, FaGraduationCap, FaGithub, FaApple} from 'react-icons/fa';

// Placeholder client IDs and redirect URIs. In a real app,
// these would likely be managed in environment variables.
const GOOGLE_CLIENT_ID = '393897977063-rt34md9e3r25c80s5q94286166u18snr.apps.googleusercontent.com';
const FACEBOOK_CLIENT_ID = 'YOUR_FACEBOOK_CLIENT_ID'; // '792054339916239';
const LINKEDIN_CLIENT_ID = 'YOUR_LINKEDIN_CLIENT_ID';
const COURSERA_CLIENT_ID = 'YOUR_COURSERA_CLIENT_ID';
const GITHUB_CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID';
const APPLE_CLIENT_ID = 'YOUR_APPLE_CLIENT_ID';

/**
 * A centralized data structure for all OAuth providers,
 * categorized by context.
 */
export const contextProviders = {
  'Personal': [
    {
      id: 'google',
      name: 'Google',
      icon: FaGoogle,
      color: '#4285F4',
      clientId: GOOGLE_CLIENT_ID,
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      scopes: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      accessType: 'offline',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: FaFacebook,
      color: '#3b5998',
      clientId: FACEBOOK_CLIENT_ID,
      authUrl: 'https://www.facebook.com/v13.0/dialog/oauth',
      scopes: 'email,public_profile',
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: FaApple,
      color: '#000',
      clientId: APPLE_CLIENT_ID,
      authUrl: 'https://appleid.apple.com/auth/authorize',
      scopes: 'name email',
    },
  ],
  'Professional': [
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: FaLinkedin,
      color: '#0077B5',
      clientId: LINKEDIN_CLIENT_ID,
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      scopes: 'r_liteprofile r_emailaddress',
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: FaGithub,
      color: '#333',
      clientId: GITHUB_CLIENT_ID,
      authUrl: 'https://github.com/login/oauth/authorize',
      scopes: 'user',
    },
  ],
  'Academic': [
    {
      id: 'coursera',
      name: 'Coursera',
      icon: FaGraduationCap,
      color: '#2127a2',
      clientId: COURSERA_CLIENT_ID,
      authUrl: 'YOUR_COURSERA_AUTH_URL',
      scopes: 'YOUR_COURSERA_SCOPES',
    },
  ],
};
