import { Slot } from "expo-router";
import { AppMetrics, AppMetricsRoot } from "expo-observe";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import OTAUpdatePrompt from "@/src/components/OTAUpdatePrompt";
import { ThemeProvider } from "@/src/theme/index";
import { queryClient } from "@/src/lib/query-client";

function Layout() {
  useEffect(() => {
    AppMetrics.markInteractive();
  }, []);

  return (
    <ThemeProvider>
      <OTAUpdatePrompt>
        <QueryClientProvider client={queryClient}>
          <Slot />
        </QueryClientProvider>
      </OTAUpdatePrompt>
    </ThemeProvider>
  );
}

export default AppMetricsRoot.wrap(Layout);
