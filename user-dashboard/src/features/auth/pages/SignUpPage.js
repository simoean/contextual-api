import React, {useState} from 'react';
import {useNavigate, Link as RouterLink} from 'react-router-dom';

import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Stack,
  Text,
  useColorModeValue,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  FormHelperText,
  Container,
  Image,
  useColorMode,
} from '@chakra-ui/react';

import {ViewIcon, ViewOffIcon, MoonIcon, SunIcon} from '@chakra-ui/icons';

import logo from 'assets/images/logo.png';

import {useAuthenticationStore} from 'features/auth/store/authenticationStore';

/**
 * SignUpPage Component
 * This component renders the sign-up page where users can create a new account.
 *
 * @returns {JSX.Element}
 * @constructor
 */
const SignUpPage = () => {
  // State variables for form inputs and loading state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hooks for navigation and toast notifications
  const toast = useToast();
  const navigate = useNavigate();

  // Get the register function from authentication store
  const {register} = useAuthenticationStore();

  // Color mode and styling
  const {colorMode, toggleColorMode} = useColorMode(); // <--- Get toggleColorMode
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  // No need for bgColor for the main Flex, as Container will handle the background

  /**
   * Handles the form submission for user registration.
   *
   * @param event - The form submission event.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Registration Error',
        description: 'Passwords do not match.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      // Call the register function from useAuth
      await register({username, password});

      toast({
        title: 'Registration Successful',
        description: 'Your account has been created and you are now logged in.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Navigate to the dashboard after successful registration and login
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'An error occurred during registration.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Render the sign-up form
  return (
    <Container centerContent minH="100vh" minW="100vw" variant="fullPageBackground" py={12}>
      <Stack
        spacing={8}
        mx={'auto'}
        maxW={'lg'}
        w={'90%'}
        py={12}
        px={6}
        bg={cardBg}
        boxShadow={'lg'}
        rounded={'lg'}
        borderWidth="1px"
        borderColor={cardBorderColor}
        position="relative"
      >
        {/* --- Theme Toggle Button --- */}
        <Box position="absolute" top={4} right={4}>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon/> : <SunIcon/>}
            onClick={toggleColorMode}
            size="md"
          />
        </Box>

        {/* --- Logo and Main Headings --- */}
        <Stack align={'center'} my={4}>
          <Image src={logo} alt="Contextual Identity API" boxSize="150px" mb={8} borderRadius="15%" p={2}/>
          <Heading fontSize={'2xl'} textAlign={'center'}>Sign up for an account</Heading>
          <Text fontSize={'lg'}>and start taking control over your <Text color={'blue.400'}
                                                                         as={'span'}>data</Text></Text>
        </Stack>

        <Box as={'form'} onSubmit={handleSubmit}>
          <Stack spacing={4} w="90%" mx="auto" my={4}>
            <FormControl id="username" isRequired>
              <FormLabel>Username</FormLabel>
              <Input
                type="text"
                placeholder="Enter your desired username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </FormControl>

            <FormControl id="password" isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  data-testid="password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    icon={showPassword ? <ViewOffIcon/> : <ViewIcon/>}
                    onClick={() => setShowPassword(!showPassword)}
                    variant="ghost"
                  />
                </InputRightElement>
              </InputGroup>
              <FormHelperText>Password must be at least 8 characters long.</FormHelperText>
            </FormControl>

            <FormControl id="confirm-password" isRequired>
              <FormLabel>Confirm Password</FormLabel>
              <InputGroup>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  data-testid="confirm-password-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    icon={showConfirmPassword ? <ViewOffIcon/> : <ViewIcon/>}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    variant="ghost"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              isLoading={loading}
              loadingText="Registering..."
              width="full"
              mt={4}
            >
              Sign Up
            </Button>
          </Stack>
        </Box>
        <Text mt={4} textAlign="center" color="gray.500">
          Already have an account?{' '}
          <Text as={RouterLink} to="/auth" color="brand.500" fontWeight="bold">
            Sign In
          </Text>
        </Text>
      </Stack>
    </Container>
  );
};

export default SignUpPage;