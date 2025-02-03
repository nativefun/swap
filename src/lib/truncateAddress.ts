/**
 * Address Truncation Utility
 * Formats Ethereum addresses for display by showing only the start and end portions.
 * Format: "0x1234...5678" (first 14 chars + last 12 chars)
 * 
 * @param {string} address - The Ethereum address to truncate
 * @returns {string} Truncated address string or empty string if address is invalid
 */
export const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 14)}...${address.slice(-12)}`;
  };