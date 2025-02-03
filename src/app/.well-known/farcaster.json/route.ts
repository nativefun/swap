export async function GET() {
    const appUrl = process.env.NEXT_PUBLIC_URL;
  
    const config = {
      accountAssociation: {
        header: "eyJmaWQiOjE5NjY0OCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGUzMTNGMDlDM2RkMzAzRjAzMzQ4QzA3N0NERjA2NEE5ZGY2MjI2NjIifQ",
        payload: "eyJkb21haW4iOiJiZXRhLm5hdGl2ZS5jZW50ZXIifQ",
        signature: "MHg0ZGI2YjAzMGViMDY4MDY0Mzc2ZjhhMTI3MWRlZmFiODA5YmJiNjlhNzdmMzc3MDQ4MmFkYmQ3NDM2MjZiMDI2MTgxMjI5ZTk2MTRlM2FhOTljZWJmMDEyZmM4ZmZjM2E3NDc5ODE1ZjkzNzk5NGE1OTNiMTczYjNjOTMxMGYxZDFj",
      },
      frame: {
        version: "1",
        name: "native",
        iconUrl: `${appUrl}/icon.png`,
        splashImageUrl: `${appUrl}/splash.png`,
        splashBackgroundColor: "#f7f7f7",
        homeUrl: appUrl,
        webhookUrl: `${appUrl}/api/webhook`,
      },
    };
  
    return Response.json(config);
  }