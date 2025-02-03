"use client";

import dynamic from "next/dynamic";

const TokenSwap = dynamic(() => import("@/components/frame/index"), {
  ssr: false,
});

export default function App({ token }: { token: string }) {
  return <TokenSwap />;
}