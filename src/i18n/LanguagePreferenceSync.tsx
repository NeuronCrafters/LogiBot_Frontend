import { useEffect, useRef } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { api } from "@/shared/api/httpClient";
import { getExplicitSelection, getLanguageSnapshot, setLanguageSaveState, useLanguagePreference } from ".";

export function LanguagePreferenceSync() {
  const { user, setUser } = useAuth();
  const { explicitVersion } = useLanguagePreference();
  const currentUser = useRef(user?._id);
  currentUser.current = user?._id;
  const queue = useRef(Promise.resolve());

  useEffect(() => {
    const userId = user?._id;
    if (!userId || getExplicitSelection() === undefined) return;
    queue.current = queue.current.then(async () => {
      if (currentUser.current !== userId || getLanguageSnapshot().explicitVersion !== explicitVersion) return;
      const language = getExplicitSelection();
      setLanguageSaveState("pending");
      try {
        const response = await api.patch("/account/preferences", { language });
        if (currentUser.current !== userId || getLanguageSnapshot().explicitVersion !== explicitVersion) return;
        setUser(previous => previous?._id === userId ? { ...previous, preferredLanguage: response.data.preferredLanguage } : previous);
        setLanguageSaveState("saved");
      } catch {
        if (currentUser.current === userId && getLanguageSnapshot().explicitVersion === explicitVersion) setLanguageSaveState("error");
      }
    });
  }, [user?._id, explicitVersion, setUser]);
  return null;
}
