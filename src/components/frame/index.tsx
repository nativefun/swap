/**
 * Main Frame Component
 * Handles the core frame functionality including:
 * - SDK initialization and context management
 * - Tab navigation between User and Swap views
 * - Transaction state management
 * - Notification handling for frame events
 * - Safe area insets for different devices
 */
"use client";

import { useEffect, useState, createContext } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Check, AlertTriangle, Loader2 } from "lucide-react";
import { FaHome } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { LuExternalLink } from "react-icons/lu";
import { RiSwapBoxLine } from "react-icons/ri";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import sdk from "@farcaster/frame-sdk";
import UserTab from "./user";
import SwapTab from "./swap";

/**
 * Type definition for Farcaster Frame context
 * Contains user information, location data, and client details
 */
type FrameContext = {
  user: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  location?: {
    type: "cast_embed" | "notification" | "launcher" | "channel";
    cast?: {
      fid: number;
      hash: string;
    };
    notification?: {
      notificationId: string;
      title: string;
      body: string;
    };
    channel?: {
      key: string;
      name: string;
      imageUrl?: string;
    };
  };
  client: {
    clientFid: number;
    added: boolean;
    safeAreaInsets?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    notificationDetails?: {
      url: string;
      token: string;
    };
  };
};

// Add Tab Control Context
type TabContextType = {
  setActiveTab: (tab: string) => void;
};

export const TabContext = createContext<TabContextType | null>(null);

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen gap-4">
    <motion.div
      className="w-16 h-16 border-4 border-primary rounded-full border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="text-stone-500 font-medium"
    >
      Loading Native Swap...
    </motion.p>
  </div>
);

/**
 * Frame Component
 * Main container for the Native Swap frame interface
 * Features:
 * - Tabbed navigation between User and Swap views
 * - Transaction status dialogs
 * - Announcement checks on load
 * - Welcome notifications for new users
 * - Responsive safe area handling
 * @returns {JSX.Element} The frame interface
 */
export default function Frame() {
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [context, setContext] = useState<FrameContext | null>(null);
  const [transactionState, setTransactionState] = useState("idle"); // idle, loading, success, error
  const [activeTab, setActiveTab] = useState("user");

  useEffect(() => {
    const initializeSDK = async () => {
      await sdk.actions.ready();
      const frameContext = await sdk.context;
      setContext(frameContext);
      setIsSDKReady(true);

      // Check for new announcements
      if (frameContext.user?.fid) {
        try {
          await fetch("/api/announcements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fid: frameContext.user.fid }),
          });
        } catch (error) {
          console.error("Failed to check announcements:", error);
        }
      }
    };
    initializeSDK();

    // Listen for frame events
    sdk.on("frameAdded", async ({ notificationDetails }) => {
      if (notificationDetails && context?.user?.fid) {
        // Send welcome notification without rate limit
        try {
          await fetch("/api/notifications", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Skip-Rate-Limit": "true", // Special header to skip rate limit
            },
            body: JSON.stringify({
              fid: context.user.fid,
              notificationId: `welcome:${context.user.fid}:${Date.now()}`, // Unique ID per welcome
              title: "Welcome home, neighbor! 🏡",
              body: "Thanks for adding Native Swap! You'll receive notifications for announcements and swaps.",
              priority: "high", // Mark as high priority notification
            }),
          });
        } catch (error) {
          console.error("Failed to send welcome notification:", error);
        }
      }
    });

    return () => {
      sdk.removeAllListeners();
    };
  }, [context?.user?.fid]);

  const resetTransaction = () => {
    setTransactionState("idle");
  };

  if (!isSDKReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-stone-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-200 to-stone-300">
      <TabContext.Provider
        value={{
          setActiveTab: (tab: string) => {
            setActiveTab(tab);
            const tabsElement = document.querySelector(
              `[data-value="${tab}"]`,
            ) as HTMLElement;
            if (tabsElement) {
              tabsElement.click();
            }
          },
        }}
      >
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <div
            className="flex-1"
            style={{
              paddingTop: `${context?.client?.safeAreaInsets?.top || 16}px`,
              paddingLeft: `${context?.client?.safeAreaInsets?.left || 16}px`,
              paddingRight: `${context?.client?.safeAreaInsets?.right || 16}px`,
            }}
          >
            <AnimatePresence mode="wait">
              <TabsContent key="user" value="user" className="m-0 h-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <UserTab />
                </motion.div>
              </TabsContent>

              <TabsContent key="swap" value="swap" className="m-0 h-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SwapTab setTransactionState={setTransactionState} />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </div>

          {/* Bottom Navigation */}
          <TabsList
            className="fixed bottom-0 left-0 right-0 grid grid-cols-2 gap-4 bg-white h-16 border-t shadow-lg max-w-2xl mx-auto z-50 rounded-none px-4"
            style={{
              marginBottom: 0,
              paddingBottom: `${context?.client?.safeAreaInsets?.bottom || 0}px`,
            }}
          >
            <TabsTrigger
              value="user"
              className="flex p-2 gap-2 items-center justify-center data-[state=active]:bg-stone-100 rounded-lg transition-colors data-[state=active]:shadow-inner"
            >
              <FaHome className="w-6 h-6" />
              Home
            </TabsTrigger>
            <TabsTrigger
              value="swap"
              className="flex p-2 gap-2 items-center justify-center data-[state=active]:bg-stone-100 rounded-lg transition-colors data-[state=active]:shadow-inner"
            >
              <RiSwapBoxLine className="w-6 h-6" />
              Swap
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </TabContext.Provider>

      {/* Success Dialog */}
      <Dialog
        open={transactionState === "success"}
        onOpenChange={resetTransaction}
      >
        <DialogContent className="sm:max-w-md w-96 rounded-xl mx-auto">
          <VisuallyHidden>
            <DialogTitle>Transaction Successful</DialogTitle>
          </VisuallyHidden>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center p-6 text-center"
          >
            <div className="flex items-center justify-center gap-2 font-bold">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="uppercase font-mono text-sm">
                Transaction Successful
              </h3>
            </div>
            <p className="text-stone-600 my-4">Your swap was successful!</p>
            <div className="space-y-3 w-full">
              <button
                className={`px-3 py-1 text-xs font-mono uppercase transition-all duration-200 hover:-rotate-1 hover:scale-110 active:scale-95 border border-transparent hover:border-current rounded-xl`}
                onClick={() => window.open("https://basescan.org", "_blank")}
              >
                <div className="flex items-center justify-center gap-1">
                  View Transaction
                  <LuExternalLink className="-mt-0.5 h-3 w-3" />
                </div>
              </button>
              <button
                className={`relative flex bg-stone-50 text-stone-600 font-mono uppercase text-xs rounded-lg items-center justify-center overflow-hidden gap-4 group h-8 px-6 duration-200 opacity-100 hover:scale-90 active:scale-90 active:shadow-inner shadow-md w-full`}
                onClick={resetTransaction}
              >
                <motion.div
                  className="absolute left-0 flex h-8 rounded-l-lg"
                  style={{
                    width: `10%`,
                    backgroundImage: `radial-gradient(circle, #a8a29e 1px, transparent 1px)`,
                    backgroundSize: "4px 4px",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `10%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                ></motion.div>
                <div className="flex items-center gap-2">
                  CLOSE
                  <FaXmark />
                </div>
              </button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={transactionState === "error"}
        onOpenChange={resetTransaction}
      >
        <DialogContent className="sm:max-w-md w-96 rounded-xl mx-auto">
          <VisuallyHidden>
            <DialogTitle>Transaction Failed</DialogTitle>
          </VisuallyHidden>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center p-6 text-center"
          >
            <div className="flex items-center justify-center gap-2 font-bold">
              <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="uppercase font-mono text-sm">
                Transaction Failed
              </h3>
            </div>
            <p className="text-stone-600 my-4">
              Oh no! Your swap wasn't successful. Please try again.
            </p>
            <button
              className={`relative flex bg-stone-50 text-stone-600 font-mono uppercase text-xs rounded-lg items-center justify-center overflow-hidden gap-4 group h-8 px-6 duration-200 opacity-100 hover:scale-90 active:scale-90 active:shadow-inner shadow-md w-full`}
              onClick={resetTransaction}
            >
              <motion.div
                className="absolute left-0 flex h-8 rounded-l-lg"
                style={{
                  width: `10%`,
                  backgroundImage: `radial-gradient(circle, #a8a29e 1px, transparent 1px)`,
                  backgroundSize: "4px 4px",
                }}
                initial={{ width: 0 }}
                animate={{ width: `10%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              ></motion.div>
              <div className="flex items-center gap-2">
                CLOSE
                <FaXmark />
              </div>
            </button>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
