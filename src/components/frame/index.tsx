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

<<<<<<< HEAD
import { useEffect, useState, createContext } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, ArrowDownUp, Check, AlertTriangle, Loader2 } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import sdk from "@farcaster/frame-sdk"
import UserTab from "./user"
import SwapTab from "./swap"
=======
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, ArrowDownUp, Check, AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import sdk from "@farcaster/frame-sdk";
import UserTab from "./user";
import SwapTab from "./swap";
>>>>>>> 34c2f6354692aa38432b1a0eb2c7f522a4fce419

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
}

export const TabContext = createContext<TabContextType | null>(null)

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
      className="text-gray-500 font-medium"
    >
      Loading NativeSwap...
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
<<<<<<< HEAD
  const [isSDKReady, setIsSDKReady] = useState(false)
  const [context, setContext] = useState<FrameContext | null>(null)
  const [transactionState, setTransactionState] = useState("idle") // idle, loading, success, error
  const [activeTab, setActiveTab] = useState("user")
=======
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [context, setContext] = useState<FrameContext | null>(null);
  const [transactionState, setTransactionState] = useState("idle"); // idle, loading, success, error
>>>>>>> 34c2f6354692aa38432b1a0eb2c7f522a4fce419

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
              title: "Welcome to Native Swap! 👋",
              body: "Thanks for adding Native Swap. You will receive notifications for successful swaps and announcements.",
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
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
<<<<<<< HEAD
      <TabContext.Provider value={{ setActiveTab: (tab: string) => {
        setActiveTab(tab)
        const tabsElement = document.querySelector(`[data-value="${tab}"]`) as HTMLElement
        if (tabsElement) {
          tabsElement.click()
        }
      }}}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div 
            className="flex-1" 
            style={{
              paddingTop: `${context?.client?.safeAreaInsets?.top || 16}px`,
              paddingLeft: `${context?.client?.safeAreaInsets?.left || 16}px`,
              paddingRight: `${context?.client?.safeAreaInsets?.right || 16}px`,
            }}
          >
            <AnimatePresence mode="wait">
              <TabsContent value="user" className="m-0 h-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <UserTab />
                </motion.div>
              </TabsContent>
=======
      <Tabs defaultValue="user" className="h-full flex flex-col">
        <div
          className="flex-1 overflow-auto p-4 md:p-8"
          style={{
            marginTop: context?.client?.safeAreaInsets?.top,
            marginBottom: context?.client?.safeAreaInsets?.bottom,
            marginLeft: context?.client?.safeAreaInsets?.left,
            marginRight: context?.client?.safeAreaInsets?.right,
          }}
        >
          <AnimatePresence mode="wait">
            <TabsContent value="user" className="m-0 h-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <UserTab />
              </motion.div>
            </TabsContent>
>>>>>>> 34c2f6354692aa38432b1a0eb2c7f522a4fce419

              <TabsContent value="swap" className="m-0 h-full">
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
            className="fixed bottom-0 left-0 right-0 h-14 grid grid-cols-2 gap-4 bg-white border-t shadow-lg max-w-2xl mx-auto z-50"
            style={{
              paddingBottom: context?.client?.safeAreaInsets?.bottom || 0,
              marginBottom: 0,
            }}
          >
            <TabsTrigger 
              value="user" 
              className="flex items-center justify-center data-[state=active]:bg-gray-100 rounded-lg transition-colors"
            >
              <User className="w-6 h-6" />
            </TabsTrigger>
            <TabsTrigger 
              value="swap" 
              className="flex items-center justify-center data-[state=active]:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowDownUp className="w-6 h-6" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </TabContext.Provider>

      {/* Success Dialog */}
      <Dialog
        open={transactionState === "success"}
        onOpenChange={resetTransaction}
      >
        <DialogContent className="sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center p-6 text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">Transaction Successful</h3>
            <p className="text-gray-600 mb-6">Successfully swapped tokens</p>
            <div className="space-y-3 w-full">
<<<<<<< HEAD
              <Button className="w-full" onClick={() => window.open("https://basescan.org", "_blank")}>
=======
              <Button
                className="w-full"
                onClick={() => window.open("https://basescan.io", "_blank")}
              >
>>>>>>> 34c2f6354692aa38432b1a0eb2c7f522a4fce419
                View Transaction
              </Button>
              <Button
                onClick={resetTransaction}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={transactionState === "error"}
        onOpenChange={resetTransaction}
      >
        <DialogContent className="sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center p-6 text-center"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">Transaction Failed</h3>
            <p className="text-gray-600 mb-6">Please try again</p>
            <Button
              onClick={resetTransaction}
              variant="outline"
              className="w-full"
            >
              Close
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
