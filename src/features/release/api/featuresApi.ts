import { api } from "@/shared/api/httpClient";
import type { Feature, FeatureRule, Scope } from "@/features/release/featureCatalog";

export const featuresApi = {
  async me(): Promise<Partial<Record<Feature, boolean>>> {
    const res = await api.get("/features/me");
    return res.data?.features ?? {};
  },
  async rules(): Promise<FeatureRule[]> {
    const res = await api.get("/features/rules");
    return res.data?.rules ?? [];
  },
  async setRule(body: { feature: Feature; scope: Scope; scopeId: string; enabled: boolean }): Promise<FeatureRule> {
    const res = await api.put("/features/rules", body);
    return res.data;
  },
  async clearRule(body: { feature: Feature; scope: Scope; scopeId: string }): Promise<void> {
    await api.post("/features/rules/clear", body);
  },
};
