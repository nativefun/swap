import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const alt = "Native Swap";
export const size = {
  width: 600,
  height: 400,
};

export const contentType = "image/png";

export default async function Image() {
  const satoshiBold = readFileSync(join(process.cwd(), 'public/fonts/satoshi/Satoshi-Bold.ttf'));

  return new ImageResponse(
    (
<<<<<<< HEAD
      <div tw="h-full w-full flex flex-col justify-center items-center relative bg-[#fafaf9]">
        <h1 tw="text-6xl font-bold text-[#059669]">NativeSwap</h1>
=======
      <div tw="h-full w-full flex flex-col justify-center items-center relative bg-white">
        <h1 tw="text-6xl">Native Swap</h1>
>>>>>>> 34c2f6354692aa38432b1a0eb2c7f522a4fce419
      </div>
    ),
    {
      ...size,
<<<<<<< HEAD
      fonts: [
        {
          name: 'Satoshi',
          data: satoshiBold,
          weight: 700,
          style: 'normal',
        },
      ],
    }
=======
    },
>>>>>>> 34c2f6354692aa38432b1a0eb2c7f522a4fce419
  );
}
