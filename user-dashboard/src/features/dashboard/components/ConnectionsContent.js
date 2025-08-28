import React, {useState, useMemo} from 'react';

import {
  VStack,
  Heading,
  Text,
  Box,
  useColorModeValue,
  Button,
  HStack,
  Tag,
  TagLabel,
  TagLeftIcon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from '@chakra-ui/react';

import {FaCheckCircle, FaTimesCircle} from 'react-icons/fa';

import {useAuthenticationStore} from 'features/auth/store/authenticationStore';
import {useIdentityStore} from 'features/dashboard/store/identityStore';

import {useConnectionActions} from 'shared/hooks/useConnectionActions';
import {contextProviders} from 'shared/data/oauthProviders';

/**
 * ConnectionsContent Component
 * Displays a list of available OAuth providers, grouped by context.
 *
 * @returns {JSX.Element}
 */
const ConnectionsContent = () => {
  // Color mode values for consistent styling
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const headingColor = useColorModeValue('brand.600', 'brand.300');

  // State for modal
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [providerToDelete, setProviderToDelete] = useState(null);

  // Get state from the stores
  const {setSelectedContextId, setRedirectFromConnections} = useAuthenticationStore();
  const {contexts, connections} = useIdentityStore();

  // Use the new custom hook for connection logic
  const {handleConnect, handleDisconnect, isDeleting} = useConnectionActions();

  // Map contexts to their providers for easy rendering
  const contextsWithProviders = useMemo(() => {
    return contexts.map(context => ({
      ...context,
      providers: contextProviders[context.name] || []
    }));
  }, [contexts]);

  const onDisconnectClick = (providerId) => {
    setProviderToDelete(providerId);
    onOpen();
  };

  /**
   * Handles the connect action, setting the store state before redirecting.
   * @param {string} providerId
   * @param {string} contextId
   */
  const handleConnectWithRedirectState = (providerId, contextId) => {
    // Set the state in the store to indicate we are redirecting from the connections page.
    setRedirectFromConnections(true);
    setSelectedContextId(contextId);
    // Now call the original connect handler.
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
                pb={8}
                borderWidth={"1px"}
                borderRadius="lg"
                boxShadow={"sm"}
                bg={cardBg}
                borderColor={cardBorderColor}
                _hover={{
                  boxShadow: "md",
                  transform: 'scale(1.01)',
                  transition: 'transform 0.1s ease-in-out',
                }}
                transition="all 0.2s ease-in-out"
              >
                <VStack align="flex-start" spacing={3} pb={2}>
                  <HStack flexWrap="wrap">
                    <Text fontSize="xl" fontWeight="bold" color={textColor} noOfLines={1}>
                      Context:
                    </Text>
                    <Text fontSize="xl" color={textColor} noOfLines={1}>
                      {context.name}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" mb={6} color="gray.500">
                    Connect the following accounts to populate your {context.name} identity.
                  </Text>
                </VStack>
                <VStack spacing={4} align="stretch">
                  {context.providers.map((provider) => {
                    const isConnected = (connections || []).some(connection => connection.providerId === provider.id);
                    return (
                      <Button
                        key={provider.id}
                        leftIcon={provider.icon}
                        width="full"
                        color={isConnected ? textColor : "white"}
                        onClick={() => {
                          if (isConnected) {
                            onDisconnectClick(provider.id);
                          } else {
                            handleConnectWithRedirectState(provider.id, context.id);
                          }
                        }}
                        isLoading={isDeleting}
                        backgroundColor={isConnected ? "transparent" : provider.color}
                        borderColor={provider.color}
                        borderWidth={isConnected ? "2px" : "0px"}
                        _hover={{
                          bg: isConnected ? "inherit" : provider.color,
                          opacity: isConnected ? 0.8 : 1,
                        }}
                        _active={{
                          bg: isConnected ? "inherit" : provider.color,
                          opacity: 0.9,
                        }}
                        transition="all 0.2s ease-in-out"
                      >
                        <HStack justifyContent="space-between" w="full">
                          <Text color={isConnected ? textColor : "white"}>{provider.name}</Text>
                          <Tag size="sm" colorScheme={isConnected ? "green" : "red"}>
                            <TagLeftIcon as={isConnected ? FaCheckCircle : FaTimesCircle}/>
                            <TagLabel>{isConnected ? "Connected" : "Connect"}</TagLabel>
                          </Tag>
                        </HStack>
                      </Button>
                    );
                  })}
                </VStack>
              </Box>
            );
          })}
        </HStack>
      ) : (
        <Text color={textColor}>No contexts found. Please add a context to view available connections.</Text>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay/>
        <ModalContent>
          <ModalHeader>Disconnect {providerToDelete}?</ModalHeader>
          <ModalCloseButton/>
          <ModalBody>
            Are you sure you want to disconnect your {providerToDelete} account? This action cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={() => {
              handleDisconnect(providerToDelete);
              onClose();
            }} isLoading={isDeleting}>
              Disconnect
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default ConnectionsContent;
