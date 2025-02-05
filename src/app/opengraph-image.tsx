import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { RiSwapBoxLine } from "react-icons/ri";

export const alt = "Native Swap";
export const size = {
  width: 600,
  height: 400,
};

export const contentType = "image/png";

export default async function Image() {
  const satoshiBold = readFileSync(
    join(process.cwd(), "public/fonts/satoshi/Satoshi-Bold.ttf"),
  );

  return new ImageResponse(
    (
      <div tw="h-full w-full flex flex-col justify-center items-center relative bg-[#fafaf9]">
        <div className="flex items-center">
          <RiSwapBoxLine className="w-10 h-10" />
          <h1 tw="text-6xl font-bold text-[#022c22]">Native Swap</h1>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Satoshi",
          data: satoshiBold,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
