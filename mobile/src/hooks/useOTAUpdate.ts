import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as Updates from "expo-updates";

const UPDATE_CHECK_COOLDOWN_MS = 30 * 60 * 1000;

export interface OTAUpdateState {
  isUpdateReady: boolean;
  isReloading: boolean;
  dismissUpdate: () => void;
  reloadForUpdate: () => Promise<void>;
}

function logUpdateError(message: string, error: unknown) {
  if (__DEV__) {
    console.warn(`[OTA] ${message}`, error);
  }
}

export function useOTAUpdate(): OTAUpdateState {
  const updates = Updates.useUpdates();
  const updatesRef = useRef(updates);
  const checkInFlightRef = useRef<Promise<void> | null>(null);
  const downloadInFlightRef = useRef<Promise<void> | null>(null);
  const lastCheckAtRef = useRef(0);
  const [hasDownloadedUpdate, setHasDownloadedUpdate] = useState(false);
  const [isPromptDismissed, setIsPromptDismissed] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  updatesRef.current = updates;

  const downloadUpdate = useCallback(async () => {
    if (!Updates.isEnabled || updatesRef.current.isUpdatePending) {
      if (updatesRef.current.isUpdatePending) {
        setHasDownloadedUpdate(true);
      }
      return;
    }

    if (downloadInFlightRef.current) {
      return downloadInFlightRef.current;
    }

    const download = (async () => {
      try {
        const result = await Updates.fetchUpdateAsync();
        if (result.isNew) {
          setHasDownloadedUpdate(true);
        }
      } catch (error) {
        logUpdateError("Update download failed; continuing with the current app.", error);
      } finally {
        downloadInFlightRef.current = null;
      }
    })();

    downloadInFlightRef.current = download;
    return download;
  }, []);

  const checkForUpdate = useCallback(async () => {
    if (!Updates.isEnabled || checkInFlightRef.current) {
      return checkInFlightRef.current ?? undefined;
    }

    if (updatesRef.current.isUpdatePending) {
      setHasDownloadedUpdate(true);
      return;
    }

    const now = Date.now();
    if (now - lastCheckAtRef.current < UPDATE_CHECK_COOLDOWN_MS) {
      return;
    }
    lastCheckAtRef.current = now;

    const check = (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          await downloadUpdate();
        }
      } catch (error) {
        logUpdateError("Update check failed; continuing with the current app.", error);
      } finally {
        checkInFlightRef.current = null;
      }
    })();

    checkInFlightRef.current = check;
    return check;
  }, [downloadUpdate]);

  useEffect(() => {
    if (updates.isUpdatePending) {
      setHasDownloadedUpdate(true);
    }
  }, [updates.isUpdatePending]);

  useEffect(() => {
    if (updates.isUpdateAvailable && !updates.isUpdatePending && !updates.isDownloading) {
      void downloadUpdate();
    }
  }, [downloadUpdate, updates.isDownloading, updates.isUpdateAvailable, updates.isUpdatePending]);

  useEffect(() => {
    void checkForUpdate();
  }, [checkForUpdate]);

  useEffect(() => {
    const previousStateRef = { current: AppState.currentState };

    const handleAppStateChange = (nextState: AppStateStatus) => {
      const previousState = previousStateRef.current;
      previousStateRef.current = nextState;

      if (nextState === "active" && previousState !== "active") {
        void checkForUpdate();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [checkForUpdate]);

  const dismissUpdate = useCallback(() => {
    setIsPromptDismissed(true);
  }, []);

  const reloadForUpdate = useCallback(async () => {
    if (isReloading) {
      return;
    }

    setIsReloading(true);
    try {
      await Updates.reloadAsync();
    } catch (error) {
      setIsReloading(false);
      logUpdateError("Update reload failed; continuing with the current app.", error);
    }
  }, [isReloading]);

  return {
    isUpdateReady: (hasDownloadedUpdate || updates.isUpdatePending) && !isPromptDismissed,
    isReloading,
    dismissUpdate,
    reloadForUpdate,
  };
}
