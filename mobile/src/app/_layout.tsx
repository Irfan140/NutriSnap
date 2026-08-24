import { Slot } from "expo-router";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { AppMetrics, AppMetricsRoot } from "expo-observe";
import { useEffect } from "react";
import OTAUpdatePrompt from "@/src/components/OTAUpdatePrompt";
import { ThemeProvider } from "@/src/theme/index";
import { env } from "@/src/config/env";

function Layout() {
  useEffect(() => {
    AppMetrics.markInteractive();
  }, []);

  return (
    <ClerkProvider publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ThemeProvider>
        <OTAUpdatePrompt>
          <Slot />
        </OTAUpdatePrompt>
      </ThemeProvider>
    </ClerkProvider>
  );
}

export default AppMetricsRoot.wrap(Layout);
