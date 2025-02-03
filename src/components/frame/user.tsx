/**
 * User Component
 * Handles user authentication and wallet connection.
 * Features:
 * - Farcaster user profile display
 * - Wallet connection management
 * - Token balance display
 * - Frame notification management
 */
"use client"

import { useEffect, useState } from "react"
import { useAccount, useDisconnect, useConnect } from "wagmi"
import { Card, CardContent } from "@/components/ui/card"
import { useTokenBalance, useEthBalance } from "@/lib/hooks/useTokenBalance"
import sdk from "@farcaster/frame-sdk"
import { truncateAddress } from "@/lib/truncateAddress"
import { Menu, LogOut, Wallet } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const NATIVE_TOKEN_ADDRESS = "0x20dd04c17afd5c9a8b3f2cdacaa8ee7907385bef"

/**
 * User Component
 * Main interface for user management and wallet interactions
 * Features:
 * - Wallet connection/disconnection
 * - Balance display for ETH and NATIVE tokens
 * - User profile information
 * - Frame notification opt-in
 * @returns {JSX.Element} The user interface
 */
export default function User() {
  const [user, setUser] = useState<any>(null)
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect, connectors } = useConnect()
  const { balance: ethBalance, isLoading: isEthLoading } = useEthBalance(address)
  const { balance: nativeBalance, isLoading: isNativeLoading } = useTokenBalance(address, NATIVE_TOKEN_ADDRESS)
  const [isFrameAdded, setIsFrameAdded] = useState(false)

  useEffect(() => {
    const initializeSDK = async () => {
      await sdk.actions.ready()
      const context = await sdk.context
      setUser(context.user)
      setIsFrameAdded(context.client.added)
    }
    initializeSDK()

    // Listen for frame events
    sdk.on('frameAdded', () => setIsFrameAdded(true))
    sdk.on('frameRemoved', () => setIsFrameAdded(false))

    return () => {
      sdk.removeAllListeners()
    }
  }, [])

  const handleAddFrame = async () => {
    try {
      const result = await sdk.actions.addFrame()
      if ('notificationDetails' in result) {
        setIsFrameAdded(true)
      }
    } catch (error) {
      console.error('Failed to add frame:', error)
    }
  }

  const handleConnect = async () => {
    try {
      const connector = connectors[0] // Frame connector should be first
      if (connector) {
        await connect({ connector })
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  if (!user || isEthLoading || isNativeLoading) {
    return <div className="flex items-center justify-center min-h-[80vh]">Loading...</div>
  }

  // Format ETH balance to 4 decimal places
  const formattedEthBalance = ethBalance 
    ? Number(ethBalance.balance_formatted).toFixed(4) 
    : "0.0000"

  // Format NATIVE balance to 4 decimal places
  const formattedNativeBalance = nativeBalance?.balance_formatted 
    ? Number(nativeBalance.balance_formatted).toFixed(4)
    : "0.0000"

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6">
      {/* Menu Button */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isFrameAdded && (
              <DropdownMenuItem onClick={handleAddFrame}>
                Add to Favorites
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => sdk.actions.openUrl(`https://basescan.org/address/${address}`)}>
              View on Basescan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isConnected ? (
              <DropdownMenuItem onClick={() => disconnect()} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect Wallet
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleConnect} className="text-blue-600">
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 p-1">
        <img
          src={user.pfpUrl || `https://effigy.im/a/${address}.png`}
          alt={user.displayName || "User avatar"}
          className="w-full h-full object-cover rounded-full"
        />
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-2xl font-bold">{user.displayName || truncateAddress(address || "")}</h3>
        <p className="text-gray-500">@{user.username || "Base Network"}</p>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 flex items-center">
              <img
                src="https://assets.coingecko.com/coins/images/279/small/ethereum.png"
                width={24}
                height={24}
                className="w-6 h-6 rounded-full mr-2"
                alt="Ethereum logo"
              />
              ETH
            </span>
            <span className="font-bold">{formattedEthBalance} ETH</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 flex items-center">
              <img
                src={nativeBalance?.logo || "https://logo.moralis.io/0x2105_0x20dd04c17afd5c9a8b3f2cdacaa8ee7907385bef_0bbcd8d5a1c676e6316497129af436fd.png"}
                width={24}
                height={24}
                className="w-6 h-6 rounded-full mr-2"
                alt="Native token logo"
              />
              {nativeBalance?.symbol || "NATIVE"}
            </span>
            <div className="text-right">
              <div className="font-bold">{formattedNativeBalance} {nativeBalance?.symbol || "NATIVE"}</div>
              {nativeBalance?.usd_value && (
                <div className="text-sm text-gray-500">
                  ${Number(nativeBalance.usd_value).toFixed(2)}
                  {nativeBalance.usd_price_24hr_percent_change && (
                    <span className={nativeBalance.usd_price_24hr_percent_change > 0 ? "text-green-500 ml-1" : "text-red-500 ml-1"}>
                      ({nativeBalance.usd_price_24hr_percent_change.toFixed(2)}%)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

