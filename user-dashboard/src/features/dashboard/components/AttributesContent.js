import React, {useState, useRef, useMemo} from 'react';
import {useNavigate} from 'react-router-dom';

import {
  VStack,
  Heading,
  Text,
  Box,
  SimpleGrid,
  useColorModeValue,
  Button,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Switch,
  useDisclosure,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  CheckboxGroup,
  Checkbox,
  Stack,
  Tag,
  TagLabel,
  Spacer,
} from '@chakra-ui/react';

import {FaLock, FaEye, FaPlus, FaEdit, FaTrashAlt} from 'react-icons/fa';

import {useIdentityStore} from 'features/dashboard/store/identityStore';
import {useAuthenticationStore} from 'features/auth/store/authenticationStore';

import {truncateText} from "shared/util/text";

/**
 * AttributesContent Component
 * Displays a list of user attributes, optionally filtered by a selected context, and provides CRUD actions.
 *
 * @param {Array<Object>} attributes - Array of all attribute objects.
 * @param {Function} addAttribute - Function from the store to add a new attribute.
 * @param {Function} updateAttribute - Function from the store to update an existing attribute.
 * @param {Function} deleteAttribute - Function from the store to delete an attribute.
 * @param {Function} fetchIdentityData - Function to re-fetch data after actions.
 */
const AttributesContent = ({
                             attributes,
                             addAttribute,
                             updateAttribute,
                             deleteAttribute,
                             fetchIdentityData
                           }) => {

  const navigate = useNavigate();

  // Color mode values for consistent styling
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const headingColor = useColorModeValue('brand.600', 'brand.300');
  const buttonColorScheme = "brand";

  // Access contexts from the identity store to populate the context selector in the modal
  const {contexts} = useIdentityStore();

  // State and disclosure hook for Add/Edit Attribute Modal
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const [currentAttribute, setCurrentAttribute] = useState(null);
  const [formName, setFormName] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formContextIds, setFormContextIds] = useState([]);
  const [formVisible, setFormVisible] = useState(false);

  // State and disclosure hook for Delete Confirmation AlertDialog
  const {isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose} = useDisclosure();
  const cancelRef = useRef();
  const [attributeToDelete, setAttributeToDelete] = useState(null);

  // Get the selectedContextId function from the Auth context
  const {selectedContextId} = useAuthenticationStore();

  // Toast hook for displaying user notifications
  const toast = useToast();

  /**
   * Memoized value for the currently selected context.
   */
  const currentSelectedContext = useMemo(() => {
    // Only try to find if selectedContextId exists and contexts array is available
    if (selectedContextId && contexts && contexts.length > 0) {
      return contexts.find(ctx => ctx.id === selectedContextId);
    }
    return null;
  }, [selectedContextId, contexts]);

  /**
   * Memoized array of attributes to display.
   * Filters attributes based on `selectedContext`, but always shows all attributes regardless of their 'visible' status.
   */
  const displayAttributes = useMemo(() => {
    if (!attributes) return [];

    if (selectedContextId) {
      // When a context is selected, filter by association with that context
      return attributes.filter(attr =>
        Array.isArray(attr.contextIds) &&
        attr.contextIds.includes(selectedContextId)
      );
    } else {
      // When no context is selected, show all attributes
      return attributes;
    }
  }, [attributes, selectedContextId]);

  /**
   * Resets form and opens modal for adding new attribute.
   */
  const handleAddClick = () => {
    setIsEditing(false);
    setCurrentAttribute(null);
    setFormName('');
    setFormValue('');
    setFormContextIds(selectedContextId ? [selectedContextId] : []);
    setFormVisible(true);
    onOpen();
  };

  /**
   * Sets form with attribute data and opens modal for editing.
   *
   * @param {Object} attribute - The attribute object to be edited.
   */
  const handleEditClick = (attribute) => {
    setIsEditing(true);
    setCurrentAttribute(attribute);
    setFormName(attribute.name);
    setFormValue(attribute.value);
    setFormContextIds(Array.isArray(attribute.contextIds) ? attribute.contextIds : []);
    setFormVisible(attribute.visible);
    onOpen();
  };

  /**
   * Handles submission of Add/Edit form.
   */
  const handleSubmit = async () => {
    try {
      const attributePayload = {
        name: formName,
        value: formValue,
        contextIds: formContextIds,
        visible: formVisible,
      };

      if (isEditing) {
        await updateAttribute(currentAttribute.id, attributePayload);
        toast({
          title: "Attribute updated.",
          description: `Attribute "${formName}" has been updated successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        await addAttribute(attributePayload);
        toast({
          title: "Attribute added.",
          description: `Attribute "${formName}" has been added successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      fetchIdentityData();
      onClose();
    } catch (error) {
      toast({
        title: "Operation failed.",
        description: error.message || "An unexpected error occurred.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Attribute operation failed:", error);
    }
  };

  /**
   * Opens delete confirmation dialog.
   *
   * @param {Object} attribute - The attribute to be deleted.
   */
  const confirmDelete = (attribute) => {
    setAttributeToDelete(attribute);
    onDeleteAlertOpen();
  };

  /**
   * Handles deletion after confirmation.
   */
  const handleDeleteConfirmed = async () => {
    if (!attributeToDelete) return;

    try {
      await deleteAttribute(attributeToDelete.id);
      toast({
        title: "Attribute deleted.",
        description: `Attribute "${attributeToDelete.name}" has been deleted.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      fetchIdentityData();
    } catch (error) {
      toast({
        title: "Deletion failed.",
        description: error.message || "An error occurred during deletion.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Attribute deletion failed:", error);
    } finally {
      onDeleteAlertClose();
      setAttributeToDelete(null);
    }
  };

  // Render the component
  return (
    <VStack align="flex-start" spacing={6} w="full">
      <HStack justifyContent="space-between" w="full">
        <Heading data-testid="attribute-heading" as="h2" size="xl" color={headingColor}>Your Attributes</Heading>
        <Button leftIcon={<FaPlus/>} colorScheme={buttonColorScheme} onClick={handleAddClick}>
          Add Attribute
        </Button>
      </HStack>
      <Text fontSize="lg" color={textColor}>
        {selectedContextId ? (
          <>
            Attributes for your{' '}"
            <Button
              variant="link"
              colorScheme="brand"
              onClick={() => navigate('/dashboard/contexts')}
              fontWeight="bold"
              fontSize="lg"
            >
              {currentSelectedContext.name}
            </Button>
            "{' '}context:{' '}
          </>
        ) : (
          <>All your attributes: </>
        )}
        Use the actions to manage them.
      </Text>

      {displayAttributes.length > 0 ? (
        <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={6} w="full">
          {displayAttributes.map((attr) => (
            <Box
              key={attr.id || `${attr.name}-${attr.value}`}
              p={5}
              borderWidth="1px"
              borderRadius="lg"
              boxShadow="sm"
              bg={cardBg}
              borderColor={cardBorderColor}
              transition="all 0.2s ease-in-out"
              onClick={() => handleEditClick(attr)}
              _hover={{
                boxShadow: "md",
                cursor: "pointer",
                transform: 'scale(1.01)',
                transition: 'transform 0.1s ease-in-out',
              }}
            >
              <VStack align="flex-start" spacing={3} h="full">
                <HStack justifyContent="space-between" mb={2} w="full">
                  <HStack flexWrap="wrap">
                    <Text fontSize="xl" fontWeight="bold" color={textColor}>{attr.name}:</Text>
                    <Text fontSize="xl" color={textColor}>{truncateText(attr.value, 35)}</Text>
                  </HStack>
                </HStack>

                {/* Display visibility status */}
                <HStack alignItems="center" mb={2}>
                  {attr.visible ? (
                    <FaEye color="green.500"/>
                  ) : (
                    <FaLock color="red.500"/>
                  )}
                  <Text fontSize="sm" color={attr.visible ? 'green.400' : 'red.400'}>
                    ({attr.visible ? 'Visible' : 'Private'})
                  </Text>
                </HStack>

                {/* Display all associated contexts as Tags */}
                {Array.isArray(attr.contextIds) && attr.contextIds.length > 0 && (
                  <HStack spacing={1} mt={2} flexWrap="wrap">
                    <Text fontSize="sm" fontWeight="semibold" color={textColor}>Contexts:</Text>
                    {attr.contextIds.map(contextId => {
                      const context = contexts.find(c => c.id === contextId);
                      return context ? (
                        <Tag key={contextId} size="sm" colorScheme="blue" borderRadius="full" variant="solid">
                          <TagLabel>{context.name}</TagLabel>
                        </Tag>
                      ) : null;
                    })}
                  </HStack>
                )}
                <Spacer/>
                {/* Actions Row at the bottom with visual split */}
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
                    colorScheme={buttonColorScheme}
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(attr);
                    }}
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
                      confirmDelete(attr);
                    }}
                  >
                    Delete
                  </Button>
                </HStack>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      ) : (
        <Text color={textColor}>
          {selectedContextId
            ? `No attributes found for your "${currentSelectedContext.name}" context. Click "Add Attribute" to create one.`
            : 'No attributes found for your user. Click "Add Attribute" to create one.'}
        </Text>
      )}

      {/* Add/Edit Attribute Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay/>
        <ModalContent>
          <ModalHeader>{isEditing ? 'Edit Attribute' : 'Add New Attribute'}</ModalHeader>
          <ModalCloseButton/>
          <ModalBody>
            <FormControl id="attribute-name" isRequired mb={4}>
              <FormLabel>Name</FormLabel>
              <Input
                placeholder="e.g., 'email', 'country'"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </FormControl>
            <FormControl id="attribute-value" isRequired mb={4}>
              <FormLabel>Value</FormLabel>
              <Input
                placeholder="e.g., 'john.doe@example.com', 'Spain'"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
              />
            </FormControl>

            {/* Multi-select for Contexts */}
            <FormControl id="attribute-contexts" mb={4}>
              <FormLabel>Associated Contexts</FormLabel>
              {contexts.length > 0 ? (
                <CheckboxGroup
                  colorScheme="brand"
                  value={formContextIds}
                  onChange={(values) => setFormContextIds(values)}
                >
                  <Stack spacing={2} direction="column">
                    {contexts.map(context => (
                      <Checkbox key={context.id} value={context.id}>
                        {context.name}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              ) : (
                <Text fontSize="sm" color="gray.500">No contexts available. Please create contexts first.</Text>
              )}
            </FormControl>

            {/* Visibility Switch */}
            <FormControl display="flex" alignItems="center" mb={4}>
              <FormLabel htmlFor="attribute-visible" mb="0">
                Make Visible?
              </FormLabel>
              <Switch
                id="attribute-visible"
                isChecked={formVisible}
                onChange={(e) => setFormVisible(e.target.checked)}
                colorScheme="green"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose} mr={3}>Cancel</Button>
            <Button colorScheme={buttonColorScheme} onClick={handleSubmit}>
              {isEditing ? 'Update Attribute' : 'Create Attribute'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Attribute
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete attribute "<strong>{attributeToDelete?.name}</strong>"? This action cannot
              be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirmed} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
};

export default AttributesContent;