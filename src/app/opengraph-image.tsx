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
  const satoshiBlack = readFileSync(
    join(process.cwd(), "public/fonts/satoshi/Satoshi-Black.ttf"),
  );

  return new ImageResponse(
    (
      <div tw="h-full w-full flex flex-col justify-center items-center relative bg-[#fafaf9]">
        <div tw="flex items-center">
          <RiSwapBoxLine
            color="#022c22"
            style={{
              height: "60px",
              marginRight: "8px",
              marginTop: "1px",
              width: "64px",
            }}
          />
          <h1 tw="text-6xl font-black text-[#022c22]">Native Swap</h1>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Satoshi",
          data: satoshiBlack,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
