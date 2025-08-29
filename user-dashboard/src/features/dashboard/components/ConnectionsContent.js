import React, {useState, useMemo} from 'react';

import {
  VStack,
  Heading,
  Text,
  Box,
  useColorModeValue,
  Button,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Flex,
  IconButton,
} from '@chakra-ui/react';

import { FaTrashAlt } from 'react-icons/fa';

import {useAuthenticationStore} from 'features/auth/store/authenticationStore';
import {useIdentityStore} from 'features/dashboard/store/identityStore';

import {useConnectionActions} from 'shared/hooks/useConnectionActions';
import {contextProviders} from 'shared/data/oauthProviders';

/**
 * ConnectionsContent Component
 * Displays a list of available OAuth providers and allows connecting multiple accounts.
 *
 * @returns {JSX.Element}
 */
const ConnectionsContent = () => {
  // Color mode values for consistent styling
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const headingColor = useColorModeValue('brand.600', 'brand.300');

  // State for the disconnect confirmation modal
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [connectionToDelete, setConnectionToDelete] = useState(null);

  // Get state from the stores
  const {setSelectedContextId, setRedirectFromConnections} = useAuthenticationStore();
  const {contexts, connections} = useIdentityStore();

  // Use the custom hook for connection logic
  const {handleConnect, handleDisconnect, isDeleting} = useConnectionActions();

  // Map contexts to their providers for easy rendering
  const contextsWithProviders = useMemo(() => {
    return contexts.map(context => ({
      ...context,
      providers: contextProviders[context.name] || []
    }));
  }, [contexts]);

  /**
   * Opens the disconnect confirmation modal.
   * @param {Object} connection - The specific connection object to be deleted.
   */
  const onDisconnectClick = (connection) => {
    setConnectionToDelete(connection);
    onOpen();
  };

  /**
   * Handles the connect action, setting the store state before redirecting.
   * @param {string} providerId
   * @param {string} contextId
   */
  const handleConnectWithRedirectState = (providerId, contextId) => {
    setRedirectFromConnections(true);
    setSelectedContextId(contextId);
    handleConnect(providerId, contextId);
  };

  return (
    <VStack align="flex-start" spacing={6} w="full">
      <Heading data-testid="connections-heading" as="h2" size="xl" color={headingColor}>Manage Connections</Heading>
      <Text fontSize="lg" color={textColor}>
        Link your external accounts to import attributes and manage your identity.
      </Text>

      {contextsWithProviders.length > 0 ? (
        <HStack spacing={6} align="stretch" w="full" wrap="wrap">
          {contextsWithProviders.map((context) => {
            return (
              <Box
                key={context.id}
                data-testid={`connection-card-${context.name}`}
                flex="1"
                minW={{base: "100%", md: "300px"}}
                p={5}
                borderWidth={"1px"}
                borderRadius="lg"
                boxShadow={"sm"}
                bg={cardBg}
                borderColor={cardBorderColor}
              >
                <VStack align="flex-start" spacing={4} h="full">
                  <Box w="full">
                    <HStack flexWrap="wrap">
                      <Text fontSize="xl" fontWeight="bold" color={textColor} noOfLines={1}>
                        Context:
                      </Text>
                      <Text fontSize="xl" color={textColor} noOfLines={1}>
                        {context.name}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" mt={1} color="gray.500">
                      Connect accounts to populate your {context.name} identity.
                    </Text>
                  </Box>

                  <VStack spacing={4} align="stretch" w="full">
                    {context.providers.map((provider) => {
                      // Find all connections for this specific provider
                      const providerConnections = (connections || []).filter(c => c.providerId === provider.id);

                      return (
                        <VStack key={provider.id} align="stretch" spacing={2}>
                          {/* Button to add a new connection */}
                          <Button
                            leftIcon={<Box as={provider.icon} />}
                            width="full"
                            color="white"
                            onClick={() => handleConnectWithRedirectState(provider.id, context.id)}
                            backgroundColor={provider.color}
                            _hover={{ opacity: 0.9 }}
                            transition="all 0.2s ease-in-out"
                          >
                            {providerConnections.length > 0 ? `Add another ${provider.name} account` : `Connect with ${provider.name}`}
                          </Button>

                          {/* List existing connections */}
                          {providerConnections.length > 0 && (
                            <VStack align="stretch" spacing={2} p={2} borderWidth="1px" borderRadius="md" borderColor={cardBorderColor}>
                              {providerConnections.map(connection => (
                                <Flex key={connection.id} align="center" justify="space-between">
                                  <HStack>
                                    <Box as={provider.icon} color={provider.color} />
                                    <Text fontSize="sm" fontWeight="medium">{connection.providerUserId || `Connected Account`}</Text>
                                  </HStack>
                                  <IconButton
                                    aria-label={`Disconnect ${connection.providerUserId}`}
                                    icon={<FaTrashAlt />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => onDisconnectClick(connection)}
                                    isLoading={isDeleting && connectionToDelete?.id === connection.id}
                                  />
                                </Flex>
                              ))}
                            </VStack>
                          )}
                        </VStack>
                      );
                    })}
                  </VStack>
                </VStack>
              </Box>
            );
          })}
        </HStack>
      ) : (
        <Text color={textColor}>No contexts found. Please add a context to view available connections.</Text>
      )}

      {/* Disconnect Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay/>
        <ModalContent>
          <ModalHeader>Disconnect Account?</ModalHeader>
          <ModalCloseButton/>
          <ModalBody>
            <Text>
              Are you sure you want to disconnect the account: <strong>{connectionToDelete?.providerUserId}</strong>?
            </Text>
            <Text mt={2} fontSize="sm">This action cannot be undone.</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" ml={3} onClick={() => {
              handleDisconnect(connectionToDelete.id); // Pass the unique connection ID
              onClose();
            }} isLoading={isDeleting}>
              Disconnect
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default ConnectionsContent;
