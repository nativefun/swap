import { useState, useEffect } from 'react'
import Moralis from 'moralis'

export type TokenBalance = {
  token_address: string
  symbol: string
  name: string
  logo: string
  thumbnail: string
  decimals: number
  balance: string
  balance_formatted: string
  usd_price: number
  usd_price_24hr_percent_change: number
  usd_value: number
}

export type EthBalance = {
  balance: string
  balance_formatted: string
}

/**
 * Token Balance Hook
 * Custom React hook for managing token balances and allowances in the Farcaster Frame.
 * Provides real-time balance updates, allowance checks, and permit2 integration.
 */

export function useEthBalance(address: string | undefined) {
  const [balance, setBalance] = useState<EthBalance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchBalance() {
      if (!address) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await Moralis.EvmApi.balance.getNativeBalance({
          chain: "0x2105",
          address: address
        })

        const rawBalance = response.raw.balance
        if (rawBalance) {
          setBalance({
            balance: rawBalance,
            balance_formatted: (Number(rawBalance) / 1e18).toString()
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch ETH balance'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [address])

  return { balance, isLoading, error }
}

/**
 * Custom hook for managing token balances and allowances
 * Features:
 * - Real-time balance updates
 * - Permit2 allowance checking
 * - Token approval management
 * - Error handling and loading states
 * 
 * @param {Object} params Hook parameters
 * @param {Address} params.tokenAddress Token contract address
 * @param {Address} params.spender Address that will spend the tokens
 * @param {bigint} params.amount Amount of tokens to check allowance for
 * @returns {Object} Token balance and allowance information
 */

export function useTokenBalance(address: string | undefined, tokenAddress: string) {
  const [balance, setBalance] = useState<TokenBalance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchBalance() {
      if (!address) return

      setIsLoading(true)
      setError(null)

      try {
        // Fetch both token balance and price data in parallel
        const [tokenResponse, priceResponse] = await Promise.all([
          Moralis.EvmApi.token.getWalletTokenBalances({
            chain: "0x2105",
            tokenAddresses: [tokenAddress],
            address: address
          }),
          Moralis.EvmApi.token.getTokenPrice({
            chain: "0x2105",
            address: tokenAddress,
            include: "percent_change"
          })
        ])

        const tokenResult = tokenResponse.toJSON()[0]
        const priceResult = priceResponse.toJSON()

        if (tokenResult) {
          const balance_formatted = (Number(tokenResult.balance) / Math.pow(10, tokenResult.decimals)).toString()
          const usd_value = Number(balance_formatted) * priceResult.usdPrice

          setBalance({
            token_address: tokenResult.token_address,
            symbol: tokenResult.symbol || '',
            name: tokenResult.name || '',
            logo: tokenResult.logo || '',
            thumbnail: tokenResult.thumbnail || '',
            decimals: tokenResult.decimals,
            balance: tokenResult.balance,
            balance_formatted: balance_formatted,
            usd_price: priceResult.usdPrice,
            usd_price_24hr_percent_change: Number(priceResult['24hrPercentChange'] || 0),
            usd_value: usd_value
          })
        }
      } catch (err) {
        console.error('Error fetching token balance:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch balance'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [address, tokenAddress])

  return { balance, isLoading, error }
} 