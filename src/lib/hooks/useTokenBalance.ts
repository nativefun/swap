import { Alchemy, Network } from "alchemy-sdk";
import { useState, useEffect } from "react";

const alchemy = new Alchemy({
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
  network: Network.BASE_MAINNET,
});

export type TokenBalance = {
  token_address: string;
  symbol: string;
  name: string;
  logo: string;
  thumbnail: string;
  decimals: number;
  balance: string;
  balance_formatted: string;
  usd_price: number;
  usd_price_24hr_percent_change: number;
  usd_value: number;
};

export type EthBalance = {
  balance: string;
  balance_formatted: string;
};

export function useEthBalance(address: string | undefined) {
  const [balance, setBalance] = useState<EthBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      if (!address) return;

      setIsLoading(true);
      setError(null);

      try {
        const rawBalance = await alchemy.core.getBalance(address);
        console.log(rawBalance);
        setBalance({
          balance: rawBalance.toString(),
          balance_formatted: (Number(rawBalance) / 1e18).toString(),
        });
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch ETH balance"),
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchBalance();
  }, [address]);

  return { balance, isLoading, error };
}

export function useTokenBalance(
  address: string | undefined,
  tokenAddress: string,
) {
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      if (!address) return;

      setIsLoading(true);
      setError(null);

      try {
        const balance = await alchemy.core.getTokenBalances(address, [
          tokenAddress,
        ]);
        const metadata = await alchemy.core.getTokenMetadata(tokenAddress);

        if (balance.tokenBalances[0]) {
          const rawBalance = balance.tokenBalances[0].tokenBalance;
          const balance_formatted = rawBalance
            ? (
                Number(rawBalance) / Math.pow(10, metadata.decimals || 18)
              ).toString()
            : "0";

          setBalance({
            token_address: tokenAddress,
            symbol: metadata.symbol || "",
            name: metadata.name || "",
            logo: metadata.logo || "",
            thumbnail: metadata.logo || "", // alchemy only provides one logo
            decimals: metadata.decimals || 18,
            balance: rawBalance || "0",
            balance_formatted,
            usd_price: 0, // would need separate price api
            usd_price_24hr_percent_change: 0,
            usd_value: 0,
          });
        }
      } catch (err) {
        console.error("Error fetching token balance:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to fetch balance"),
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchBalance();
  }, [address, tokenAddress]);

  return { balance, isLoading, error };
}
