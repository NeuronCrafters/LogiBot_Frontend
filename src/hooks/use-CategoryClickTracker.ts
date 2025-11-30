import { useEffect, useRef } from "react";
import { api } from "@/services/api/api";

const STORAGE_KEY = "category_clicks";
const FLUSH_INTERVAL_MS = 12 * 60 * 60 * 1000;

type ClickCounts = Record<string, number>;

export function useCategoryClickTracker(userId: string | null) {
    const clicksRef = useRef<ClickCounts>({});
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try { clicksRef.current = JSON.parse(stored); }
            catch { clicksRef.current = {}; }
        }
        scheduleFlush();
        return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
    }, []);

    function recordClick(subject: string) {
        if (!subject) return;
        clicksRef.current[subject] = (clicksRef.current[subject] || 0) + 1;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clicksRef.current));
    }

    async function flushClicks() {
        if (!userId) return;
        const payload = clicksRef.current;
        if (Object.keys(payload).length === 0) return;
        try {
            await api.post(
                "/useranalysis/subject-clicks",
                { userId, clicks: payload },
                { withCredentials: true }
            );
            clicksRef.current = {};
            localStorage.removeItem(STORAGE_KEY);
        } catch (err) {
            console.error("Erro ao enviar clicks de categoria:", err);
        }
    }

    function scheduleFlush() {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
            flushClicks().finally(scheduleFlush);
        }, FLUSH_INTERVAL_MS);
    }

    return { recordClick, flushClicks };
}
