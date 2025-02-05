/**
 * User Component
 * Handles user authentication and wallet connection.
 * Features:
 * - Farcaster user profile display
 * - Wallet connection management
 * - NATIVE token balance display
 * - Announcements display
 * - Frame notification management
 */
"use client";

import { useEffect, useState, useContext } from "react";
import { useAccount, useDisconnect, useConnect } from "wagmi";
import { useTokenBalance } from "@/lib/hooks/useTokenBalance";
import sdk from "@farcaster/frame-sdk";
import { truncateAddress } from "@/lib/truncateAddress";
import { FaArrowRight, FaHouse } from "react-icons/fa6";
import { PiHouseSimpleBold } from "react-icons/pi";
import { Menu, LogOut, Wallet, ExternalLink } from "lucide-react";
import {
  getLatestAnnouncements,
  type Announcement,
} from "@/lib/supbase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { TabContext } from "./index";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

const NATIVE_TOKEN_ADDRESS = "0x20dd04c17afd5c9a8b3f2cdacaa8ee7907385bef";

// Type for Farcaster user
type FarcasterUser = {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
};

// Announcement Item Component
const AnnouncementItem = ({
  title,
  text,
  castUrl,
}: {
  title: string;
  text: string;
  castUrl?: string;
}) => (
  <div className="py-2">
    <div className="flex justify-between items-center">
      <h3 className="font-bold text-lg">{title}</h3>
      {castUrl && (
        <button
          onClick={async () => {
            try {
              await sdk.actions.openUrl(castUrl);
            } catch (error) {
              console.error("Failed to open cast URL:", error);
            }
          }}
          className="flex items-center text-3xs font-mono gap-1 uppercase text-stone-500 hover:text-stone-700"
        >
          <div className="pt-0.5">View Cast</div>
          <ExternalLink className="h-3 w-3" />
        </button>
      )}
    </div>
    <p className="text-stone-600 mt-2 line-clamp-2">{text}</p>
    <div className="mt-4 border-b border-stone-200" />
  </div>
);

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
    <motion.div
      className="w-16 h-16 border-4 border-primary rounded-full border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
    <motion.div className="space-y-2">
      <motion.div
        className="h-4 w-32 bg-stone-200 rounded animate-pulse"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      <motion.div
        className="h-4 w-24 bg-stone-200 rounded animate-pulse"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      />
    </motion.div>
  </div>
);

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
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const { balance: nativeBalance, isLoading: isNativeLoading } =
    useTokenBalance(address, NATIVE_TOKEN_ADDRESS);
  const [isFrameAdded, setIsFrameAdded] = useState(false);
  const tabContext = useContext(TabContext);

  useEffect(() => {
    const initializeSDK = async () => {
      await sdk.actions.ready();
      const context = await sdk.context;
      setUser(context.user);
      setIsFrameAdded(context.client.added);
    };
    initializeSDK();

    // Listen for frame events
    sdk.on("frameAdded", () => setIsFrameAdded(true));
    sdk.on("frameRemoved", () => setIsFrameAdded(false));

    return () => {
      sdk.removeAllListeners();
    };
  }, []);

  // Load announcements
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const latest = await getLatestAnnouncements(5);
        setAnnouncements(latest);
      } catch (error) {
        console.error("Failed to load announcements:", error);
      }
    };
    loadAnnouncements();
  }, []);

  const handleAddFrame = async () => {
    try {
      const result = await sdk.actions.addFrame();
      if ("notificationDetails" in result) {
        setIsFrameAdded(true);
      }
    } catch (error) {
      console.error("Failed to add frame:", error);
    }
  };

  const handleConnect = async () => {
    try {
      const connector = connectors[0]; // Frame connector should be first
      if (connector) {
        await connect({ connector });
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  if (!user || isNativeLoading) {
    return <LoadingSpinner />;
  }

  const formattedNativeBalance = nativeBalance?.balance_formatted
    ? Number(nativeBalance.balance_formatted).toLocaleString(undefined, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      })
    : "0.0000";

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 rounded-xl w-full p-2">
      <div className="flex-none">
        {/* Profile Header */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-14 h-14 rounded-full bg-stone-100 overflow-hidden flex-shrink-0">
              {user.pfpUrl ? (
                <img
                  src={user.pfpUrl}
                  alt={user.displayName || user.username || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-base sm:text-lg truncate flex items-center">
                Welcome home,{" "}
                <span className="text-sm ml-0.5 mr-px inline-block">@</span>
                {user.username || "neighbor"}!
              </h2>
              <p className="text-xs text-stone-400 truncate">
                FID {user.fid} • {truncateAddress(address || "")}
              </p>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="pb-4">
          <div className="bg-stone-100 rounded-xl p-4 sm:p-5">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <span className="text-stone-600 flex items-center font-mono text-xs">
                  <img
                    src={
                      nativeBalance?.logo ||
                      "https://www.native.fun/images/native_logo_fill.png"
                    }
                    width={16}
                    height={16}
                    className="w-5 h-5 rounded-full mr-1"
                    alt="Native token logo"
                  />
                  {nativeBalance?.symbol || "NATIVE"}
                </span>
                <div className="flex items-center gap-0.5 text-xl text-stone-700 font-bold">
                  {nativeBalance?.symbol === "NATIVE" ? (
                    <PiHouseSimpleBold className="inline-block mt-0.5 h-4 w-4" />
                  ) : (
                    ""
                  )}
                  {formattedNativeBalance}
                  {nativeBalance?.symbol === "NATIVE"
                    ? ""
                    : " " + nativeBalance?.symbol || "NATIVE"}
                </div>
                {/*{nativeBalance?.usd_value && nativeBalance?.usd_value > 0 && (
                  <div className="text-sm text-stone-500">
                    ${Number(nativeBalance.usd_value).toFixed(2)}
                    {nativeBalance.usd_price_24hr_percent_change && (
                      <span
                        className={
                          nativeBalance.usd_price_24hr_percent_change > 0
                            ? "text-emerald-600 ml-1"
                            : "text-rose-600 ml-1"
                        }
                      >
                        (
                        {nativeBalance.usd_price_24hr_percent_change.toFixed(2)}
                        %)
                      </span>
                    )}
                  </div>
                )}*/}
              </div>

              <button
                className={`relative flex bg-stone-50 text-stone-600 font-mono uppercase text-xs rounded-lg items-center justify-center overflow-hidden gap-4 group h-8 px-6 duration-200 opacity-100 hover:scale-90 active:scale-90 active:shadow-inner shadow-md`}
                onClick={() => tabContext?.setActiveTab("swap")}
              >
                <motion.div
                  className="absolute left-0 flex h-8 rounded-l-lg"
                  style={{
                    width: `10%`,
                    backgroundImage: `radial-gradient(circle, #239821 1px, transparent 1px)`,
                    backgroundSize: "4px 4px",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `10%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                ></motion.div>
                <div className="flex items-center gap-2">
                  BUY
                  <FaArrowRight />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Announcements Section */}
      <div className="flex-1 mt-2">
        <h3 className="flex items-center justify-between font-mono uppercase text-xs sm:text-xs px-4 sm:px-6 pb-2 gap-2">
          Announcements
          <div className="h-0.5 w-80 bg-stone-500" />
        </h3>
        <ScrollArea className="h-[calc(100vh-320px)] sm:h-[calc(100vh-360px)]">
          <div className="pb-4 px-4">
            <div className="space-y-2">
              {announcements.map((announcement, index) => (
                <div key={`announcement-${index}`}>
                  <AnnouncementItem
                    title={announcement.title}
                    text={announcement.text}
                    castUrl={announcement.cast_url}
                  />
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Menu (Absolute Positioned) */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 mt-1 mr-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-stone-50 border-stone-300 shadow-xl"
          >
            {!isFrameAdded && (
              <DropdownMenuItem onClick={handleAddFrame}>
                Add Frame to Favorites
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() =>
                sdk.actions.openUrl(`https://basescan.org/address/${address}`)
              }
            >
              View Wallet on Basescan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isConnected ? (
              <DropdownMenuItem
                onClick={() => disconnect()}
                className="text-rose-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect Wallet
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={handleConnect}
                className="text-blue-600"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
