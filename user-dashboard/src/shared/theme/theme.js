import { extendTheme } from '@chakra-ui/react';

// Define your custom color palette
const colors = {
  brand: {
    50: '#e0f7f7',  // Lightest teal
    100: '#b3e0e0',
    200: '#80caca',
    300: '#4db3b3',
    400: '#269999',
    500: '#008080',
    600: '#006666',
    700: '#004d4d',
    800: '#003333',
    900: '#001a1a',  // Darkest teal
  },
  // You can define other custom colors here if needed
};

const theme = extendTheme({
  colors, // Integrate your custom colors
  // You can also customize typography, spacing, components, etc.
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'md',
      },
      variants: {
        solid: (props) => ({
          bg: props.colorScheme === 'brand' ? 'brand.500' : 'blue.500', // Use brand color for primary buttons
          color: 'white',
          _hover: {
            bg: props.colorScheme === 'brand' ? 'brand.600' : 'blue.600',
          },
        }),
        outline: (props) => ({
          borderColor: props.colorScheme === 'brand' ? 'brand.500' : 'gray.200',
          color: props.colorScheme === 'brand' ? 'brand.500' : 'gray.700',
          _hover: {
            bg: props.colorScheme === 'brand' ? 'brand.50' : 'gray.50',
          },
        }),
        ghost: (props) => ({
          _hover: {
            bg: props.colorScheme === 'brand' ? 'brand.50' : 'gray.50',
          },
        }),
      },
    },
    // Customize other components like Input, Checkbox, Card (Box) here
  },
  config: {
    initialColorMode: 'light', // Default theme
    useSystemColorMode: false, // Don't rely on system preference
  },
});

export default theme;