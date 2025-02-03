import type { Metadata } from "next";

import "@/app/globals.css";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "Native Swap",
  description: "The official Farcaster Frame for swapping Native.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="overflow-y-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
