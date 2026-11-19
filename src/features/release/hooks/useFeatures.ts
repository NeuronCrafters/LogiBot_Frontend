import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { featuresApi } from "@/features/release/api/featuresApi";
import type { Feature } from "@/features/release/featureCatalog";

/**
 * Released features for the signed-in person. While loading (or if the request fails) everything
 * counts as released: the API blocks for real, this only hides what is not available.
 */
export function useFeatures() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["features", "me", user?._id ?? ""],
    queryFn: featuresApi.me,
    enabled: !!user,
    staleTime: 60 * 1000,
  });
  const isEnabled = useCallback((feature: Feature) => !data || typeof data !== "object" || data[feature] !== false, [data]);
  return { isEnabled };
}
