export async function GET() {
<<<<<<< HEAD
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
=======
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjE5MywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDM5Y2ZkMzJmMDY3MGNhOTBEZmNiMEYxOUZkNDZGRjEwMzc5QzViNDQifQ",
      payload: "eyJkb21haW4iOiJzd2FwLm5hdGl2ZS5mdW4ifQ",
      signature:
        "MHg3NjQzZWI3MTVjMzhiOGRhNTQ5ZGQ1OGU2NDhjZmYxMDg2MTlhNGZmYTJhN2Q5ZmIyYjhkOGY2ZTQzNjMzNmM0NDNjNmM2Y2ZlZWJhMTA5YzlhNDE1YmM2Njk1OGY1MThlNzgzZGU0ZTUxMDNkMzNiMDRhZmRjMmU0OTBiYjYxNDFj",
    },
    frame: {
      version: "1",
      name: "Native Swap",
      iconUrl: `${appUrl}/icon.png`,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#fafaf9",
      homeUrl: appUrl,
      webhookUrl: `${appUrl}/api/webhook`,
    },
  };

  return Response.json(config);
}
>>>>>>> 34c2f6354692aa38432b1a0eb2c7f522a4fce419
