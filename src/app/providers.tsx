"use client";

import dynamic from "next/dynamic";

const WagmiProvider = dynamic(
  () => import("@/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

const MoralisProvider = dynamic(
  () => import("@/components/providers/MoralisProvider"),
  {
    ssr: false,
  }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider>
      <MoralisProvider>
        {children}
      </MoralisProvider>
    </WagmiProvider>
  );
}