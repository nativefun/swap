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
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { RiSwapBoxLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import qs from "qs";
import sdk from "@farcaster/frame-sdk";
import type { QuoteResponse } from "@/lib/types/zeroex";
import { useTokenBalance } from "@/lib/hooks/useTokenBalance";

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

const formatBalance = (
  value: number | string | undefined,
  decimals: number = 5,
): string => {
  if (!value) return "0.00000";

  const numValue = typeof value === "string" ? Number(value) : value;

  return numValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

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
  const [isSelling, setIsSelling] = useState(false);
  const sellToken = isSelling ? NATIVE_TOKEN : ETH;
  const buyToken = isSelling ? ETH : NATIVE_TOKEN;
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [isFinalized, setIsFinalized] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse>();
  const [fetchPriceError, setFetchPriceError] = useState<string[]>([]);
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const { balance: nativeBalance } = useTokenBalance(
    address,
    NATIVE_TOKEN.address,
  );
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
      await sdk.actions.ready();
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
      console.log(data);
      setQuote(data);
    } finally {
      setIsPriceLoading(false);
      fetchPrice(params);
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

  const handleSwapTokens = useCallback(() => {
    setIsSelling(!isSelling);
    setSellAmount("");
    setBuyAmount("");
    setIsFinalized(false);
    setQuote(undefined);
    setFetchPriceError([]);
  }, [isSelling]);

  const handlePercentageClick = useCallback(
    (percentage: number) => {
      const balance = isSelling
        ? nativeBalance?.balance_formatted
        : ethBalance?.value
          ? formatUnits(ethBalance.value, 18)
          : "0";

      if (balance) {
        const amount = (Number(balance) * percentage).toFixed(6);
        setSellAmount(amount);
      }
    },
    [isSelling, nativeBalance, ethBalance],
  );

  useEffect(() => {
    if (isConfirmed) {
      setTransactionState("success");
      // Send success notification without rate limit
      const sendNotification = async () => {
        try {
          const context = await sdk.context;
          if (context.user?.fid) {
            let titleText =
              buyToken.symbol === "NATIVE"
                ? "You bought $NATIVE! 🏡"
                : "Swap successful.";

            let bodyText =
              buyToken.symbol === "NATIVE"
                ? `You successfully swapped ${sellAmount} ${sellToken.symbol} for ${buyAmount} ${buyToken.symbol}! Welcome home, neighbor.`
                : `Successfully swapped ${sellAmount} ${sellToken.symbol} for ${buyAmount} ${buyToken.symbol}`;

            await fetch("/api/notifications", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Skip-Rate-Limit": "true", // Special header to skip rate limit
              },
              body: JSON.stringify({
                fid: context.user.fid,
                notificationId: hash,
                title: titleText,
                body: bodyText,
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
      sellToken: sellToken.address,
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
        fetchQuote(params);
        fetchPrice(params);
        // fetchFn(params);
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
    sellToken.address,
    isFinalized,
    fetchPrice,
    fetchQuote,
  ]);

  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-500" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-6 px-6 pb-4 space-y-4">
          {/* Input Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-stone-600 font-mono text-2xs uppercase mx-1">
              <span>You pay</span>
              <span>
                Balance:{" "}
                {isSelling
                  ? formatBalance(nativeBalance?.balance_formatted)
                  : formatBalance(
                      ethBalance?.value
                        ? formatUnits(ethBalance.value, 18)
                        : "0",
                    )}{" "}
                {sellToken.symbol}
              </span>
            </div>
            <div className="flex items-center space-x-2 px-2 py-4 bg-stone-50 rounded-xl">
              <div className="flex items-center space-x-2 bg-white pl-1 pr-3 py-1 h-9 rounded-lg border">
                <img
                  src={sellToken.image}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full"
                  alt={`${sellToken.symbol} logo`}
                />
                <span className="text-sm font-medium">{sellToken.symbol}</span>
              </div>
              <Input
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                className="flex-1 bg-white text-right text-base font-mono"
                placeholder="0.0"
              />
            </div>
            {/* Percentage Buttons */}
            <div className="flex gap-2 mt-2">
              {[0.25, 0.5, 0.75, 1].map((percentage, index) => (
                <Button
                  key={`percentage-${percentage}`}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePercentageClick(percentage)}
                  className="flex-1 text-2xs rounded-full hover:-rotate-2 hover:bg-emerald-600 hover:text-white hover:scale-105 active:scale-95 active:shadow-inner font-mono uppercase"
                >
                  {percentage * 100}%
                </Button>
              ))}
            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center py-2">
            <div className="h-px bg-stone-200 w-36 my-2" />
            {/*<Button
              variant="ghost"
              size="icon"
              onClick={handleSwapTokens}
              className="bg-white shadow-md rounded-full h-8 w-8 z-10 transition-all duration-200 hover:bg-emerald-600 hover:text-white font-bold rotate-90 active:duration-300 active:rotate-180"
            >
              <RiSwapBoxLine className="h-6 w-6" />
            </Button>*/}
          </div>

          {/* Output Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-stone-600 font-mono text-2xs uppercase mx-1">
              <span>You receive</span>
              <span>
                1 {sellToken.symbol} ≈{" "}
                {quote &&
                Number(quote.buyAmount) > 0 &&
                Number(quote.sellAmount) > 0
                  ? formatBalance(
                      Number(
                        formatUnits(BigInt(quote.buyAmount), buyToken.decimals),
                      ) /
                        Number(
                          formatUnits(
                            BigInt(quote.sellAmount),
                            sellToken.decimals,
                          ),
                        ),
                      0,
                    )
                  : "0.0"}{" "}
                {buyToken.symbol}
              </span>
            </div>
            <div className="flex items-center space-x-2 px-2 py-4 bg-stone-50 rounded-xl">
              <div className="flex items-center space-x-2 bg-white pl-1 pr-3 py-1 h-9 rounded-lg border">
                <img
                  src={buyToken.image}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full"
                  alt={`${buyToken.symbol} logo`}
                />
                <span className="text-sm font-medium">{buyToken.symbol}</span>
              </div>
              <Input
                type="text"
                min={0}
                value={formatBalance(Number(buyAmount))}
                className="flex-1 text-stone-500 bg-white text-right text-base font-mono pr-6"
                readOnly
              />
            </div>
          </div>

          {/* Error Messages */}
          {fetchPriceError.length > 0 && (
            <div className="text-rose-600 text-center text-sm p-2 bg-rose-50 rounded-xl">
              {fetchPriceError.map((error, index) => (
                <div key={`priceError-${index}`}>
                  {error.replace("Error: ", "")}
                </div>
              ))}
            </div>
          )}
          {error && (
            <div className="relative flex items-baseline gap-2 text-rose-600 text-center text-sm p-2 bg-rose-50 rounded-xl">
              <span className="font-mono text-2xs text-rose-200 uppercase">
                Error
              </span>
              <div className="absolute left-0 right-0 flex-1 text-center w-full">
                {(error as BaseError).shortMessage.replace("Error: ", "") ||
                  error.message.replace("Error: ", "")}
              </div>
            </div>
          )}

          <button
            className={`relative flex bg-stone-50 text-stone-600 font-mono uppercase text-sm rounded-lg items-center justify-center overflow-hidden gap-4 group h-12 px-6 duration-200 opacity-100 hover:scale-95 active:scale-95 active:shadow-inner shadow-md w-full disabled:hover:scale-100 disabled:shadow-inner disabled:opacity-50`}
            onClick={isFinalized ? executeSwap : finalize}
            disabled={
              !isConnected ||
              !sellAmount ||
              !buyAmount ||
              isPending ||
              isConfirming
            }
          >
            <motion.div
              className="absolute left-0 flex h-12 rounded-l-lg"
              style={{
                width: `10%`,
                backgroundImage: `radial-gradient(circle, #239821 1px, transparent 1px)`,
                backgroundSize: "4px 4px",
              }}
              initial={{ width: 0 }}
              animate={{ width: `10%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            ></motion.div>
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
          </button>

          <div className="h-4 flex items-center justify-center text-xs text-stone-500 text-center">
            {quote && Number(quote.minBuyAmount) > 0
              ? `Minimum received:${" "} ${formatBalance(
                  formatUnits(BigInt(quote.minBuyAmount), buyToken.decimals),
                )} ${buyToken.symbol}`
              : " "}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
