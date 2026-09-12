import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import HomePage from "./pages/home";
import PrivacyPage from "./pages/privacy";
import DeleteAccountPage from "./pages/delete-account";
import { useSiteRoute } from "./lib/router";

export default function App() {
  const route = useSiteRoute();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {route === "privacy" ? (
          <PrivacyPage />
        ) : route === "delete-account" ? (
          <DeleteAccountPage />
        ) : (
          <HomePage />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
