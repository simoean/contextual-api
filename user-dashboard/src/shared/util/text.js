/**
 * A utility function to truncate a string to a specified length.
 * If the string is longer than the limit, it will be cut and an ellipsis (...) added.
 * @param {string} text The string to truncate.
 * @param {number} maxLength The maximum length of the string before truncation.
 * @returns {string} The truncated string.
 */
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
};
