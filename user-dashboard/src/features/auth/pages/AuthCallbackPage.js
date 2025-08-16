import React, {useState, useEffect} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';

import {
  useToast,
  Spinner,
  Flex,
  Text,
  Container,
  Heading,
  Stack,
  VStack,
  Input,
  Checkbox,
  Button,
  FormControl,
  FormLabel,
  useColorModeValue,
  SimpleGrid,
  Card,
  CardBody,
  HStack,
  Select,
  IconButton,
  Tootip,
  Spacer,
  Box,
  Image,
  useColorMode, Tooltip
} from '@chakra-ui/react';

import {FaTrashAlt, FaEdit} from 'react-icons/fa';
import {MoonIcon, SunIcon} from '@chakra-ui/icons';

import {useAuthenticationStore} from 'features/auth/store/authenticationStore';
import {fetchAttributes, saveAttributesBulk, saveConnection} from 'shared/api/authService';
import {useIdentityStore} from "features/dashboard/store/identityStore";

import logo from "assets/images/logo.png";

/**
 * Post-Social Login Page
 * This page handles the redirect from a successful social login.
 * It displays a list of attributes fetched from the provider, allowing the user to
 * review and edit them before they are persisted to the database.
 *
 * @returns {JSX.Element}
 * @constructor
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const {colorMode, toggleColorMode} = useColorMode();
  const [searchParams] = useSearchParams();

  // Get the state values from the store.
  const {setProviderConnected, selectedContextId, accessToken, isAuthenticated, userInfo, redirectFromConnections, setRedirectFromConnections} = useAuthenticationStore();
  const {contexts, fetchIdentityData} = useIdentityStore();

  const [attributes, setAttributes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [provider, setProvider] = useState(null);
  const [confirmingRemoveId, setConfirmingRemoveId] = useState(null);

  // Set the redirection path based on the store's state
  const redirectPath = redirectFromConnections ? '/dashboard/connections' : '/auth/connect';

  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const footerBg = useColorModeValue('white', 'gray.800');
  const footerBorderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const status = searchParams.get('status');
    const providerFromUrl = searchParams.get('provider');
    const providerAccessToken = searchParams.get('providerAccessToken');
    const errorMessage = searchParams.get('message');

    // Make sure we have the required parameters and that the user is authenticated
    // with your app's token already in the store.
    if (status === 'success' && providerAccessToken && isAuthenticated && userInfo) {
      setProvider(providerFromUrl);

      const fetchUserAttributes = async () => {
        try {
          // The token is already available here from a previous action (e.g., login).
          const fetchedAttributes = await fetchAttributes({
            provider: providerFromUrl,
            token: accessToken,
            providerToken: providerAccessToken
          });

          // Now fetch the full identity data to get the contexts
          await fetchIdentityData(accessToken);

          setAttributes(fetchedAttributes);
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching attributes:', error);
          setIsLoading(false);
          toast({
            title: 'Error',
            description: 'Could not fetch user attributes. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          // Use the dynamic redirect path here
          navigate(redirectPath);
        }
      };

      fetchUserAttributes();

    } else if (status === 'error' && errorMessage) {
      toast({
        title: 'Authentication Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      // Use the dynamic redirect path here
      navigate(redirectPath);
    } else {
      // If the authentication state is not what we expect, redirect the user.
      toast({
        title: 'An unexpected error occurred',
        description: 'You are not logged in or we could not process your request.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      // Use the dynamic redirect path here
      navigate(redirectPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, searchParams, accessToken, isAuthenticated, userInfo, toast, fetchIdentityData]);

  /**
   * Handles changes to the attribute inputs (name, value, visible, or contextId).
   * @param {string} id - The ID of the attribute being changed.
   * @param {string} key - The key of the property to update ('name', 'value', or 'contextId').
   * @param {*} value - The new value.
   */
  const handleAttributeChange = (id, key, value) => {
    setAttributes(
      attributes.map((attr) => {
        // If the key is 'contextIds', wrap the value in an array.
        const newValue = key === 'contextIds' ? [value] : value;
        return attr.id === id ? {...attr, [key]: newValue} : attr;
      })
    );
  };

  /**
   * Handles the removal of an attribute.
   * @param {string} id - The ID of the attribute to remove.
   */
  const handleRemoveAttribute = (id) => {
    // If we're already confirming the removal for this ID,
    // then it's the second click, so we remove the item.
    if (confirmingRemoveId === id) {
      setAttributes(attributes.filter(attr => attr.id !== id));
      setConfirmingRemoveId(null);
      toast({
        title: 'Attribute Removed',
        description: 'The attribute has been removed from the list.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } else {
      // First click: show the confirmation
      setConfirmingRemoveId(id);
    }
  };

  /**
   * Handles the "Cancel" action.
   * This clears any temporary token and redirects to the connect page.
   */
  const handleCancel = () => {
    toast({
      title: 'Action Canceled',
      description: 'Your changes have been discarded.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    // Reset the redirect state
    setRedirectFromConnections(false);
    // Use the dynamic redirect path here
    navigate(redirectPath);
  };

  /**
   * Handles the "Save" action.
   * This calls a backend endpoint to persist the attributes and connection.
   */
  const handleSave = async () => {
    setIsSaving(true);
    console.log('Saving attributes and connection...');

    const providerAccessToken = searchParams.get('providerAccessToken');
    if (!accessToken || !provider || !providerAccessToken || !selectedContextId) {
      toast({
        title: 'Error',
        description: 'Missing authentication data or context ID.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsSaving(false);
      return;
    }

    try {
      // 1. Save the connections
      await saveConnection({
        token: accessToken,
        providerId: provider,
        contextId: selectedContextId,
        providerAccessToken: providerAccessToken,
      });

      // 2. Save the attributes in bulk
      await saveAttributesBulk(accessToken, attributes);

      // 3. Update the store state to reflect the new connection
      await fetchIdentityData(accessToken)
      setProviderConnected(provider);
      setIsSaving(false);

      toast({
        title: 'Attributes & Connection Saved',
        description: 'Your attributes and connection have been successfully saved.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Reset the redirect state
      setRedirectFromConnections(false);
      // Use the dynamic redirect path here
      navigate(redirectPath);
    } catch (error) {
      console.error('Error saving attributes and connection:', error);
      setIsSaving(false);
      toast({
        title: 'Error Saving',
        description: 'Could not save attributes and connection. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Flex height="100vh" alignItems="center" justifyContent="center" direction="column">
        <Spinner size="xl" color="brand.500"/>
        <Text mt={4}>Processing your login...</Text>
      </Flex>
    );
  }

  return (
    <Container centerContent minH="100vh" minW="100vw" variant="fullPageBackground" mb={8} py={0}>
      <Flex direction="column" h="100vh" maxW={'600px'} w={'600px'} mx="auto">
        <Stack
          spacing={8}
          mx={'auto'}
          mt={8}
          maxW={'600px'}
          w={'600px'}
          py={12}
          px={6}
          pb={24}
          bg={cardBg}
          boxShadow={'lg'}
          rounded={'lg'}
          borderWidth="1px"
          borderColor={cardBorderColor}
          position="relative"
        >
          {/* Theme toggle fixed to the container's top-right corner */}
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
            <Heading fontSize={'2xl'} textAlign={'center'}>Review and Edit Your Attributes</Heading>
            <Text fontSize={'lg'} textAlign="center">
              These attributes were imported from
              your {provider && provider[0].toUpperCase() + provider.slice(1)} account.
            </Text>
          </Stack>

          <SimpleGrid columns={1} spacing={6}>
            {attributes.map((attr) => (
              <Card key={attr.id} bg={cardBg} borderWidth="1px" borderColor={cardBorderColor} rounded="lg">
                <CardBody>
                  <VStack spacing={3} align="stretch" h="full">
                    <FormControl>
                      <FormLabel fontWeight="bold">Attribute Name</FormLabel>
                      <Input
                        value={attr.name}
                        onChange={(e) => handleAttributeChange(attr.id, 'name', e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontWeight="bold">Attribute Value</FormLabel>
                      <Input
                        value={attr.value}
                        onChange={(e) => handleAttributeChange(attr.id, 'value', e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontWeight="bold">Context</FormLabel>
                      <Select
                        value={attr.contextIds && attr.contextIds.length > 0 ? attr.contextIds[0] : ''}
                        onChange={(e) => handleAttributeChange(attr.id, 'contextIds', e.target.value)}
                      >
                        {contexts.map((context) => (
                          <option key={context.id} value={context.id}>
                            {context.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <Checkbox
                      isChecked={attr.visible}
                      onChange={(e) => handleAttributeChange(attr.id, 'visible', e.target.checked)}
                    >
                      Is Visible?
                    </Checkbox>

                    <Spacer/>

                    <HStack
                      w="full"
                      justifyContent="flex-end"
                      spacing={2}
                      mt={3}
                      pt={3}
                      borderTopWidth="1px"
                      borderColor={cardBorderColor}
                    >
                      <Button
                        leftIcon={<FaEdit/>}
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </Button>
                      <Button
                        leftIcon={<FaTrashAlt/>}
                        size="sm"
                        colorScheme="red"
                        variant="solid"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAttribute(attr.id);
                        }}
                      >
                        {confirmingRemoveId === attr.id ? "Are you sure?" : "Remove"}
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Flex>
      {/* Fixed footer is a sibling to the main content Flex child */}
      <HStack
        spacing={4}
        p={4}
        justifyContent="center"
        w="full"
        position="fixed"
        bottom="0"
        bg={footerBg}
        boxShadow="lg"
        borderTopWidth="1px"
        borderColor={footerBorderColor}
        maxW={'600px'}
      >
        <Button onClick={handleCancel} variant="outline" colorScheme="red" isLoading={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} colorScheme="green" isLoading={isSaving}>
          Save and Continue
        </Button>
      </HStack>
    </Container>
  );
};

export default AuthCallbackPage;
