import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';

import axios from 'axios';

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
  useColorMode,
  useColorModeValue,
  useToast,
  IconButton,
  Container,
  Image
} from '@chakra-ui/react';

import {MoonIcon, SunIcon} from '@chakra-ui/icons';
import logo from 'assets/images/logo.png'

import {useAuth} from '../context/AuthContext';
import {useAuthParams} from 'shared/hooks';

/**
 * SignInPage Component
 * This component handles user authentication.
 * It provides a login form and integrates with the AuthContext for authentication logic.
 *
 * @returns {JSX.Element}
 * @constructor
 */
const SignInPage = () => {

  // State variables for username, password, and loading state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const toast = useToast(); // <-- Initialize useToast hook

  // Parse query parameters
  const {clientId, redirectUri, isClientFlow} = useAuthParams();

  const {handleLoginSuccess} = useAuth();

  // Chakra UI hook for color mode
  const { colorMode, toggleColorMode } = useColorMode();
  const formBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  /**
   * Handle Sign In Action
   * This function is triggered when the user submits the login form.
   *
   * @param e - The form submission event
   * @returns {Promise<void>}
   */
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        username,
        password,
      });
      console.log('Login successful:', response.data);

      // Display success toast
      toast({
        title: "Login Successful!",
        description: "You have been successfully logged in.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom"
      });

      // Update the authentication context with the user data
      handleLoginSuccess(response.data);

      if (isClientFlow) {
        // It's a client sign-in, redirect to ContextSelectionPage
        navigate(`/auth/context?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`);
      } else {
        // Navigate to the dashboard after successful login
        navigate('/dashboard');
      }

    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'An unexpected error occurred.';
      if (err.response) {
        errorMessage = err.response.data.message || 'Login failed. Please check your credentials.';
      } else if (err.request) {
        errorMessage = 'No response from server. Please try again later.';
      }

      // Display error toast
      toast({
        title: "Login Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom"
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Cancel Action
   * This function is triggered when the user clicks the cancel button.
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

  // Render the sign-in form
  return (
    <Container
      centerContent
      minH="100vh"
      minW="100vw"
      bg={useColorModeValue('gray.50', 'gray.800')}
      py={12}
    >
      <Stack
        spacing={8}
        mx={'auto'}
        w={'90%'}
        py={12}
        px={6}
        bg={formBg}
        boxShadow={'lg'}
        rounded={'lg'}
        color={textColor}
        position="relative"
      >
        {/* Theme Toggle Button - Top Right */}
        <Box position="absolute" top={0} right={4}>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            size="md"
            isRound={true}
            bg={useColorModeValue('gray.200', 'gray.600')}
            color={useColorModeValue('gray.800', 'white')}
            _hover={{ bg: useColorModeValue('gray.300', 'gray.500') }}
          />
        </Box>

        <Stack align={'center'} my={4}>
          <Image
            src={logo}
            alt="Contextual Identity API"
            boxSize="150px"
            mb={8}
            borderRadius="15%"
            p={2}
          />
          <Heading fontSize={'2xl'} textAlign={'center'}>
            Sign in to your account
          </Heading>
          <Text fontSize={'lg'}>
            and take control over your <Text color={'blue.400'} as={'span'}>data</Text>
          </Text>
        </Stack>
        <Box as={'form'} onSubmit={handleSignIn}>
          <Stack
            spacing={4}
            w="90%"
            mx="auto"
            my={4}
          >
            <FormControl id="username">
              <FormLabel>Username</FormLabel>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </FormControl>
            <FormControl id="password">
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </FormControl>

            <HStack spacing={4} justifyContent="flex-end" w="100%">
              {isClientFlow && (
                <Button
                  variant="solid"
                  colorScheme="gray"
                  onClick={handleCancel}
                  size="lg"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                colorScheme="brand"
                isLoading={loading}
                loadingText="Signing In..."
                size="lg"
                flexGrow={1}
                maxW={isClientFlow ? "auto" : "100%"}
              >
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