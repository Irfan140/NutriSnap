import { Slot } from "expo-router";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { AppMetrics, AppMetricsRoot } from "expo-observe";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import OTAUpdatePrompt from "@/src/components/OTAUpdatePrompt";
import { ThemeProvider } from "@/src/theme/index";
import { env } from "@/src/config/env";
import { queryClient } from "@/src/lib/query-client";

function Layout() {
  useEffect(() => {
    AppMetrics.markInteractive();
  }, []);

  return (
    <ClerkProvider publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ThemeProvider>
        <OTAUpdatePrompt>
          <QueryClientProvider client={queryClient}>
            <Slot />
          </QueryClientProvider>
        </OTAUpdatePrompt>
      </ThemeProvider>
    </ClerkProvider>
  );
}

export default AppMetricsRoot.wrap(Layout);
