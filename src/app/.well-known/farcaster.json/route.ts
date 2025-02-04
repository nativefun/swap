export async function GET() {
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
