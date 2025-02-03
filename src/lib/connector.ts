/**
 * Farcaster Frame Connector
 * Custom Wagmi connector implementation for Farcaster wallet integration.
 * Provides wallet connection, chain switching, and account management functionality.
 */
import sdk from "@farcaster/frame-sdk";
import { SwitchChainError, fromHex, getAddress, numberToHex } from "viem";
import { ChainNotConfiguredError, createConnector } from "wagmi";

frameConnector.type = "frameConnector" as const;

/**
 * Creates a Farcaster wallet connector for Wagmi
 * Implements standard wallet connection methods and Farcaster-specific functionality
 * @returns Wagmi connector instance for Farcaster wallet
 */
export function frameConnector() {
  let connected = true;

  return createConnector<typeof sdk.wallet.ethProvider>((config) => ({
    id: "farcaster",
    name: "Farcaster Wallet",
    type: frameConnector.type,

    /**
     * Initial setup of the connector
     * Automatically connects to the first chain in the config
     */
    async setup() {
      this.connect({ chainId: config.chains[0].id });
    },

    /**
     * Connects to the Farcaster wallet
     * @param {Object} options - Connection options
     * @param {number} options.chainId - Optional chain ID to connect to
     * @returns {Promise<{ accounts: string[], chainId: number }>} Connected account details
     */
    async connect({ chainId } = {}) {
      const provider = await this.getProvider();
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });

      let currentChainId = await this.getChainId();
      if (chainId && currentChainId !== chainId) {
        const chain = await this.switchChain!({ chainId });
        currentChainId = chain.id;
      }

      connected = true;

      return {
        accounts: accounts.map((x) => getAddress(x)),
        chainId: currentChainId,
      };
    },

    /**
     * Disconnects from the Farcaster wallet
     */
    async disconnect() {
      connected = false;
    },

    /**
     * Gets the currently connected accounts
     * @returns {Promise<string[]>} Array of connected account addresses
     * @throws {Error} If not connected
     */
    async getAccounts() {
      if (!connected) throw new Error("Not connected");
      const provider = await this.getProvider();
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });
      return accounts.map((x) => getAddress(x));
    },

    /**
     * Gets the current chain ID
     * @returns {Promise<number>} Current chain ID
     */
    async getChainId() {
      const provider = await this.getProvider();
      const hexChainId = await provider.request({ method: "eth_chainId" });
      return fromHex(hexChainId, "number");
    },

    /**
     * Checks if the wallet is currently authorized
     * @returns {Promise<boolean>} True if authorized and has accounts
     */
    async isAuthorized() {
      if (!connected) {
        return false;
      }

      const accounts = await this.getAccounts();
      return !!accounts.length;
    },

    /**
     * Switches to a different chain
     * @param {Object} params - Switch chain parameters
     * @param {number} params.chainId - Target chain ID
     * @returns {Promise<Chain>} The chain that was switched to
     * @throws {SwitchChainError} If chain is not configured
     */
    async switchChain({ chainId }) {
      const provider = await this.getProvider();
      const chain = config.chains.find((x) => x.id === chainId);
      if (!chain) throw new SwitchChainError(new ChainNotConfiguredError());

      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: numberToHex(chainId) }],
      });
      return chain;
    },

    /**
     * Handles account changes from the wallet
     * @param {string[]} accounts - New account addresses
     */
    onAccountsChanged(accounts) {
      if (accounts.length === 0) this.onDisconnect();
      else
        config.emitter.emit("change", {
          accounts: accounts.map((x) => getAddress(x)),
        });
    },

    /**
     * Handles chain changes from the wallet
     * @param {string} chain - New chain ID in hex
     */
    onChainChanged(chain) {
      const chainId = Number(chain);
      config.emitter.emit("change", { chainId });
    },

    /**
     * Handles wallet disconnection
     */
    async onDisconnect() {
      config.emitter.emit("disconnect");
      connected = false;
    },

    /**
     * Gets the Farcaster wallet provider
     * @returns {Promise<typeof sdk.wallet.ethProvider>} Wallet provider instance
     */
    async getProvider() {
      return sdk.wallet.ethProvider;
    },
  }));
}