/**
 * Address Truncation Utility
 * Formats Ethereum addresses for display by showing only the start and end portions.
 * Format: "0xAb12...5678" (first 6 chars + last 4 chars)
 * 
 * @param {string} address - The Ethereum address to truncate
 * @returns {string} Truncated address string or empty string if address is invalid
 */
export const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };