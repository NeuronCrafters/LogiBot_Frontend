import { useEffect, useState } from "react";
import { exercisesApi } from "@/features/exercises/api/exercisesApi";
import type { PracticeBankItem, PracticeBankType } from "@/features/exercises/types";

/**
 * Questions the professors of the student's class marked for practice.
 * Failures (offline, other roles) simply leave the built-in examples alone.
 */
export function usePracticeBank<T extends PracticeBankType>(type: T): Array<Extract<PracticeBankItem, { type: T }>> {
  const [items, setItems] = useState<Array<Extract<PracticeBankItem, { type: T }>>>([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await exercisesApi.listPracticeQuestions(type);
        if (alive && Array.isArray(list)) setItems(list.filter((item): item is Extract<PracticeBankItem, { type: T }> => item.type === type));
      } catch {
        // Only the built-in examples are offered.
      }
    })();
    return () => { alive = false; };
  }, [type]);
  return items;
}
