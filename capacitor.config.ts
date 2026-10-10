import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: process.env.TOOLINGER_OWNER_APP
    ? "io.toolinger.owner"
    : "io.toolinger.app",
  appName: process.env.TOOLINGER_OWNER_APP ? "Toolinger Owner" : "Toolinger",
  webDir: process.env.TOOLINGER_OWNER_APP ? "owner-shell" : "dist",
  server: {
    androidScheme: "https",
    ...(process.env.TOOLINGER_OWNER_APP
      ? {
          url: "https://tools.choicematrix.in/owner/",
          allowNavigation: [
            "tools.choicematrix.in",
            "toolinger-owner.cloudflareaccess.com",
            "dash.cloudflare.com",
            "oauth-callbacks.cloudflareaccess.com",
          ],
        }
      : {}),
  },
};

export default config;
