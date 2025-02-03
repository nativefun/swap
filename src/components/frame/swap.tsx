/**
 * Swap Component
 * Handles token swapping functionality with 0x Protocol integration.
 * Features:
 * - Real-time price fetching
 * - Token balance display
 * - Transaction execution and monitoring
 * - Success/failure notifications
 * - Affiliate fee handling
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import { parseUnits, formatUnits, type BaseError } from "viem";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import qs from "qs";
import sdk from "@farcaster/frame-sdk";
import type { QuoteResponse } from "@/lib/types/zeroex";

/**
 * Token interface defining the structure of tradeable tokens
 */
interface Token {
  symbol: string;
  name: string;
  image: string;
  address: string;
  decimals: number;
}

/**
 * Predefined token configurations
 * ETH: Base chain's native ETH
 * NATIVE_TOKEN: The native token for swapping
 */
const ETH: Token = {
  symbol: "ETH",
  name: "Ethereum",
  image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  decimals: 18,
};

const NATIVE_TOKEN: Token = {
  symbol: "NATIVE",
  name: "Native Token",
  image: "https://www.native.fun/images/native_logo_fill.png",
  address: "0x20dd04c17afd5c9a8b3f2cdacaa8ee7907385bef",
  decimals: 18,
};

/**
 * Swap configuration constants
 */
const AFFILIATE_FEE = 25;
const YOUR_ADDRESS = process.env.NEXT_PUBLIC_SPLITS_ADDRESS;

/**
 * Props for the Swap component
 */
interface SwapProps {
  setTransactionState: (state: string) => void;
}

/**
 * Swap Component
 * Provides the main swap interface for trading ETH to NATIVE tokens
 * Features:
 * - Real-time price updates
 * - Balance checking
 * - Transaction execution
 * - Success notifications
 * - Error handling
 * @param {SwapProps} props - Component props
 * @returns {JSX.Element} The swap interface
 */
export default function Swap({ setTransactionState }: SwapProps) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const sellToken = ETH;
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const buyToken = NATIVE_TOKEN;
  const [isFinalized, setIsFinalized] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse>();
  const [fetchPriceError, setFetchPriceError] = useState<string[]>([]);
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const parsedSellAmount = sellAmount
    ? parseUnits(sellAmount, sellToken.decimals).toString()
    : undefined;
  const parsedBuyAmount = buyAmount
    ? parseUnits(buyAmount, buyToken.decimals).toString()
    : undefined;
  const [isPriceLoading, setIsPriceLoading] = useState(false);

  const {
    data: hash,
    isPending,
    error,
    sendTransaction,
  } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  useEffect(() => {
    const load = async () => {
      sdk.actions.ready();
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  const finalize = useCallback(() => {
    setIsFinalized(true);
  }, []);

  const fetchPrice = useCallback(
    async (params: unknown) => {
      setIsPriceLoading(true);
      try {
        const response = await fetch(`/api/price?${qs.stringify(params)}`);
        const data = await response.json();

        if (data?.validationErrors?.length > 0) {
          setFetchPriceError(data.validationErrors);
        } else {
          setFetchPriceError([]);
        }

        if (data.buyAmount) {
          setBuyAmount(formatUnits(data.buyAmount, buyToken.decimals));
        }
      } finally {
        setIsPriceLoading(false);
      }
    },
    [buyToken.decimals],
  );

  const linkToBaseScan = useCallback((hash?: string) => {
    if (hash) {
      sdk.actions.openUrl(`https://basescan.org/tx/${hash}`);
    }
  }, []);

  const fetchQuote = useCallback(async (params: unknown) => {
    setIsPriceLoading(true);
    try {
      const response = await fetch(`/api/quote?${qs.stringify(params)}`);
      const data = await response.json();
      setQuote(data);
    } finally {
      setIsPriceLoading(false);
    }
  }, []);

  const executeSwap = useCallback(() => {
    if (quote) {
      setTransactionState("loading");
      sendTransaction({
        gas: quote.transaction.gas ? BigInt(quote.transaction.gas) : undefined,
        to: quote.transaction.to,
        data: quote.transaction.data,
        value: BigInt(quote.transaction.value),
      });
    }
  }, [quote, sendTransaction, setTransactionState]);

  useEffect(() => {
    if (isConfirmed) {
      setTransactionState("success");
      // Send success notification without rate limit
      const sendNotification = async () => {
        try {
          const context = await sdk.context;
          if (context.user?.fid) {
            await fetch("/api/notifications", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Skip-Rate-Limit": "true", // Special header to skip rate limit
              },
              body: JSON.stringify({
                fid: context.user.fid,
                notificationId: hash,
                title: "Swap Successful! 🎉",
                body: `Successfully swapped ${sellAmount} ${sellToken.symbol} for ${buyAmount} ${buyToken.symbol}`,
                priority: "high", // Mark as high priority notification
              }),
            });
          }
        } catch (error) {
          console.error("Failed to send notification:", error);
        }
      };
      sendNotification();
    } else if (error) {
      setTransactionState("error");
    }
  }, [
    isConfirmed,
    error,
    setTransactionState,
    hash,
    sellAmount,
    sellToken.symbol,
    buyAmount,
    buyToken.symbol,
  ]);

  useEffect(() => {
    const params = {
      chainId: 8453,
      sellToken: ETH.address,
      buyToken: buyToken.address,
      sellAmount: parsedSellAmount,
      buyAmount: parsedBuyAmount,
      taker: address,
      swapFeeRecipient: YOUR_ADDRESS,
      swapFeeBps: AFFILIATE_FEE,
      swapFeeToken: buyToken.address,
      tradeSurplusRecipient: YOUR_ADDRESS,
    };

    const timeoutId = setTimeout(() => {
      if (sellAmount !== "") {
        const fetchFn = isFinalized ? fetchQuote : fetchPrice;
        fetchFn(params);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [
    address,
    buyAmount,
    buyToken.address,
    parsedBuyAmount,
    parsedSellAmount,
    sellAmount,
    isFinalized,
    fetchPrice,
    fetchQuote,
  ]);

  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-6 space-y-8">
          {/* ETH Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium text-gray-700">
              <span>You pay</span>
              <span>
                Balance:{" "}
                {ethBalance?.value ? formatUnits(ethBalance.value, 18) : "0.0"}{" "}
                ETH
              </span>
            </div>
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border">
                <img
                  src={sellToken.image}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full"
                  alt={`${sellToken.symbol} logo`}
                />
                <span className="font-medium">{sellToken.symbol}</span>
              </div>
              <Input
                type="number"
                inputMode="decimal"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                className="flex-1 bg-transparent text-right text-xl font-medium"
                placeholder="0.0"
              />
            </div>
          </div>

          {/* NATIVE Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium text-gray-700">
              <span>You receive</span>
              <span>
                1 ETH ≈ {buyAmount || "0.0"} {buyToken.symbol}
              </span>
            </div>
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border">
                <img
                  src={buyToken.image}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full"
                  alt={`${buyToken.symbol} logo`}
                />
                <span className="font-medium">{buyToken.symbol}</span>
              </div>
              <Input
                type="text"
                value={buyAmount}
                className="flex-1 bg-transparent text-right text-xl font-medium"
                placeholder="0.0"
                readOnly
              />
            </div>
          </div>

          {/* Error Messages */}
          {fetchPriceError.length > 0 && (
            <div className="text-red-500 text-sm">
              {fetchPriceError.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          )}
          {error && (
            <div className="text-red-500 text-sm">
              Error: {(error as BaseError).shortMessage || error.message}
            </div>
          )}

          {/* Swap Button */}
          <Button
            onClick={isFinalized ? executeSwap : finalize}
            disabled={
              !isConnected ||
              !sellAmount ||
              !buyAmount ||
              isPending ||
              isConfirming
            }
            className="w-full py-6 text-lg font-semibold"
          >
            {!isConnected ? (
              "Connect Wallet"
            ) : isPending || isConfirming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </>
            ) : isFinalized ? (
              "Confirm Swap"
            ) : (
              "Review Swap"
            )}
          </Button>

          {quote && (
            <div className="text-sm text-gray-500 text-center">
              Minimum received:{" "}
              {formatUnits(BigInt(quote.minBuyAmount), buyToken.decimals)}{" "}
              {buyToken.symbol}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
