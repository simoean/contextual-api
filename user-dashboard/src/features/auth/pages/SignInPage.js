import React, {useState, useMemo, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  HStack,
  Heading,
  Text,
  Tooltip,
  useColorMode,
  useColorModeValue,
  useToast,
  IconButton,
  Container,
  Image
} from '@chakra-ui/react';

import {MoonIcon, SunIcon} from '@chakra-ui/icons';
import logo from 'assets/images/logo.png';

import {useAuthenticationStore} from 'features/auth/store/authenticationStore';
import useAuthParams from 'shared/hooks/useAuthParams';
import {fetchConsents} from 'shared/api/authService';

/**
 * SignInPage Component
 * This component handles user authentication.
 * It provides a login form and integrates with the AuthContext for authentication logic.
 *
 * @returns {JSX.Element}
 * @constructor
 */
const SignInPage = () => {

  // State variables for user input and loading state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Hooks for navigation and toast notifications
  const navigate = useNavigate();
  const toast = useToast();

  // Get authentication parameters from the URL (clientId, redirectUri, isClientFlow)
  const {clientId, redirectUri, isClientFlow} = useAuthParams();

  // Get the login and register functions from the AuthContext
  const {
    login,
    isAuthenticated,
    storedClientId,
    setAuthFlowParams,
    accessToken,
    userInfo,
  } = useAuthenticationStore();

  // Color mode and styling
  const {colorMode, toggleColorMode} = useColorMode();
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const isDashboardDirectAccess = useMemo(() => !isClientFlow, [isClientFlow]);

  /**
   * Effect to check if the user is already authenticated.
   * This handles the redirect logic on page load.
   */
  useEffect(() => {
    const handleRedirect = async () => {
      // If user is already authenticated, handle the redirect
      if (isAuthenticated && isClientFlow && accessToken) {
        try {
          // Fetch all user consents
          const userConsents = await fetchConsents(accessToken);
          // Check if a consent exists for the current client
          const hasConsent = userConsents.some(consent => consent.clientId === clientId);

          if (hasConsent && window.opener && redirectUri) {
            window.opener.postMessage({
              type: 'CONTEXT_AUTH_SUCCESS',
              payload: {
                token: accessToken,
                userId: userInfo?.userId,
                username: userInfo?.username
              }
            }, redirectUri);
            window.close();
          } else {
            navigate(`/auth/context?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`);
          }
        } catch (error) {
          console.error("Failed to check for existing consent:", error);
          // If the check fails, redirect to the context selection page as a safe fallback
          navigate(`/auth/context?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`);
        }
      } else if (isAuthenticated && !isClientFlow) {
        navigate('/dashboard');
      }

      // Store the auth parameters if they exist in the URL
      if (isClientFlow && clientId) {
        setAuthFlowParams(clientId);
      }
    };

    handleRedirect();
  }, [isAuthenticated, navigate, isClientFlow, clientId, redirectUri, setAuthFlowParams, accessToken, userInfo]);

  /**
   * Handles the sign-in process
   * This function is triggered when the user submits the login form.
   *
   * @param e - The event object from the form submission
   * @returns {Promise<void>}
   */
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loginClientId = storedClientId || clientId;

      await login(username, password, loginClientId);

      toast({
        title: "Login Successful!", description: "You have been successfully logged in.",
        status: "success", duration: 3000, isClosable: true, position: "bottom"
      });

      if (isClientFlow && accessToken) {
        try {
          const userConsents = await fetchConsents(accessToken);
          const hasConsent = userConsents.some(consent => consent.clientId === clientId);
          if (hasConsent && window.opener && redirectUri) {
            window.opener.postMessage({
              type: 'CONTEXT_AUTH_SUCCESS',
              payload: {
                token: accessToken,
                userId: userInfo?.userId,
                username: userInfo?.username
              }
            }, redirectUri);
            window.close();
          } else {
            navigate(`/auth/context?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`);
          }
        } catch (error) {
          console.error("Failed to check for existing consent:", error);
          // Fallback to the context selection page if the check fails
          navigate(`/auth/context?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`);
        }
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      console.error('Login error:', err);
      let errorMessage;
      if (err.response) {
        errorMessage = err.response.data.message || 'Login failed. Please check your credentials.';
      } else if (err.request) {
        errorMessage = 'No response from server. Please try again later.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred.';
      }

      toast({
        title: "Login Failed", description: errorMessage,
        status: "error", duration: 5000, isClosable: true, position: "bottom"
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the cancel action
   * This function is triggered when the user clicks the Cancel button.
   */
  const handleCancel = () => {
    if (isClientFlow) {
      if (window.opener && !window.opener.closed) {
        window.close();
      } else {
        console.warn("Could not close popup window. Navigating back.");
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  /**
   * Handles the sign-up action
   * This function is triggered when the user clicks the Sign Up button.
   */
  const handleSignUpClick = () => {
    navigate('/auth/signup');
  };

  // Render the SignInPage component
  return (
    <Container centerContent minH="100vh" minW="100vw" variant="fullPageBackground" py={8}>
      <Stack
        spacing={8}
        mx={'auto'}
        maxW={isClientFlow ? 'lg' : '600px'}
        w={isClientFlow ? '90%' : '600px'}
        py={12}
        px={6}
        bg={cardBg}
        boxShadow={'lg'}
        rounded={'lg'}
        borderWidth="1px"
        borderColor={cardBorderColor}
        position="relative"
      >
        <Box position="absolute" top={4} right={4}>
          <Tooltip label="Toggle Color Mode">
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              size="md"
            />
          </Tooltip>
        </Box>
        <Stack align={'center'} my={4}>
          <Image src={logo} alt="Contextual Identity API" boxSize="150px" mb={8} borderRadius="15%" p={2}/>
          <Heading fontSize={'2xl'} textAlign={'center'}>Sign in to your account</Heading>
          <Text fontSize={'lg'}>and take control over your <Text color={'blue.400'} as={'span'}>data</Text></Text>
        </Stack>
        <Box as={'form'} onSubmit={handleSignIn}>
          <Stack spacing={4} w="90%" mx="auto" my={4}>
            <FormControl id="username">
              <FormLabel>Username</FormLabel>
              <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                     placeholder="Enter your username"/>
            </FormControl>
            <FormControl id="password">
              <FormLabel>Password</FormLabel>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                     placeholder="Enter your password"/>
            </FormControl>
            <HStack spacing={4} mt={8} justifyContent="flex-end" w="100%">
              {isClientFlow && (
                <Button variant="solid" colorScheme="gray" onClick={handleCancel} size="lg" flexGrow={1}>
                  Cancel
                </Button>
              )}
              {isDashboardDirectAccess && (
                <Button variant="outline" colorScheme="brand" onClick={handleSignUpClick} size="lg" flexGrow={1}>
                  Sign Up
                </Button>
              )}
              <Button type="submit" colorScheme="brand" isLoading={loading} loadingText="Signing In..." size="lg"
                      flexGrow={1} maxW={isDashboardDirectAccess ? "auto" : "100%"}>
                Sign In
              </Button>
            </HStack>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default SignInPage;
