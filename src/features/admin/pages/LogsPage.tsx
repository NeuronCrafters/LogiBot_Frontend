import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useAdminLogsSocket,
  type AdminLogEntry,
  type AdminLogLevel,
  type AdminLogSource,
} from "@/features/admin/hooks/useAdminLogsSocket";
import {
  AlertTriangle,
  Eraser,
  Info,
  Search,
  Server,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";

type SourceTab = "all" | AdminLogSource;

const SOURCE_TABS: { id: SourceTab; label: string }[] = [
  { id: "all", label: "Tudo" },
  { id: "backend", label: "Backend" },
  { id: "worker", label: "Worker" },
];

const LEVEL_OPTIONS: { id: "ALL" | AdminLogLevel; label: string }[] = [
  { id: "ALL", label: "Todos" },
  { id: "INFO", label: "Info" },
  { id: "WARN", label: "Aviso" },
  { id: "ERROR", label: "Erro" },
];

const LEVEL_META: Record<AdminLogLevel, { color: string; bg: string; icon: React.ReactNode }> = {
  INFO: {
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    icon: <Info className="h-3.5 w-3.5" />,
  },
  WARN: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  ERROR: {
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function LevelBadge({ level }: { level: AdminLogLevel }) {
  const meta = LEVEL_META[level];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium font-[Poppins] shrink-0 ${meta.color} ${meta.bg}`}
    >
      {meta.icon}
      {level}
    </span>
  );
}

function SourceBadge({ source }: { source: AdminLogSource }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium font-[Poppins] text-zinc-400 shrink-0">
      <Server className="h-3 w-3" />
      {source === "backend" ? "Backend" : "Worker"}
    </span>
  );
}

function LogRow({ entry }: { entry: AdminLogEntry }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-neutral-900/60 px-3 py-2 hover:border-white/10 transition-colors">
      <span className="mt-0.5 text-[11px] text-zinc-500 font-mono shrink-0 w-[78px]">
        {formatTime(entry.timestamp)}
      </span>
      <LevelBadge level={entry.level} />
      <SourceBadge source={entry.source} />
      <span className="text-[11px] text-zinc-400 font-mono shrink-0">[{entry.scope}]</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-200 font-[Poppins] break-words">{entry.message}</p>
        {entry.details !== undefined && entry.details !== null && (
          <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-black/30 p-2 text-[11px] text-zinc-400 font-mono whitespace-pre-wrap break-words">
            {typeof entry.details === "string"
              ? entry.details
              : JSON.stringify(entry.details, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

function StatusIndicator({ status }: { status: "connecting" | "connected" | "disconnected" | "error" }) {
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-[Poppins]">
        <Wifi className="h-3.5 w-3.5" />
        Conectado
      </span>
    );
  }
  if (status === "connecting") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 font-[Poppins]">
        <Wifi className="h-3.5 w-3.5 animate-pulse" />
        Conectando...
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-red-400 font-[Poppins]">
      <WifiOff className="h-3.5 w-3.5" />
      {status === "error" ? "Erro de conexão" : "Desconectado"}
    </span>
  );
}

export function LogsPage() {
  const { user } = useAuth();
  const isAdmin = Array.isArray(user?.role)
    ? user.role.includes("admin")
    : user?.role === "admin";

  const { entries, status, clear } = useAdminLogsSocket(!!user && isAdmin);

  const [sourceTab, setSourceTab] = useState<SourceTab>("all");
  const [levelFilter, setLevelFilter] = useState<"ALL" | AdminLogLevel>("ALL");
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);

  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (sourceTab !== "all" && entry.source !== sourceTab) return false;
      if (levelFilter !== "ALL" && entry.level !== levelFilter) return false;
      if (!q) return true;
      return (
        entry.message.toLowerCase().includes(q) ||
        entry.scope.toLowerCase().includes(q)
      );
    });
  }, [entries, sourceTab, levelFilter, search]);

  const counts = useMemo(() => {
    const acc: Record<SourceTab, number> = { all: entries.length, backend: 0, worker: 0 };
    for (const entry of entries) acc[entry.source] += 1;
    return acc;
  }, [entries]);

  useEffect(() => {
    if (!autoScroll) return;
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [filtered, autoScroll]);

  function handleScroll() {
    const node = listRef.current;
    if (!node) return;
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    setAutoScroll(distanceFromBottom < 80);
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500 font-[Poppins] text-sm">Acesso restrito.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 font-[Poppins]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Logs em Tempo Real</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Acompanhe o que está acontecendo no backend e no worker conforme ocorre.
          </p>
        </div>
        <StatusIndicator status={status} />
      </div>

      {/* Source tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {SOURCE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSourceTab(tab.id)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium font-[Poppins] transition-colors ${
              sourceTab === tab.id
                ? "border-blue-500/40 bg-blue-500/15 text-blue-300"
                : "border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-zinc-500">{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {LEVEL_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setLevelFilter(option.id)}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium font-[Poppins] transition-colors ${
                levelFilter === option.id
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/10 bg-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por mensagem ou escopo..."
              className="w-64 rounded-lg border border-white/10 bg-neutral-900 py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 font-[Poppins] focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            />
          </div>
          <button
            onClick={clear}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-[Poppins] transition-colors"
          >
            <Eraser className="h-3.5 w-3.5" />
            Limpar
          </button>
        </div>
      </div>

      {/* Log list */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 min-h-[420px] max-h-[65vh] overflow-y-auto rounded-2xl border border-white/10 bg-neutral-950/60 p-3 flex flex-col gap-1.5"
      >
        {filtered.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <p className="text-sm text-zinc-500 font-[Poppins]">
              {entries.length === 0 ? "Aguardando novos logs..." : "Nenhum log corresponde aos filtros."}
            </p>
          </div>
        ) : (
          filtered.map((entry) => <LogRow key={entry.id} entry={entry} />)
        )}
      </div>

      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            const node = listRef.current;
            if (node) node.scrollTop = node.scrollHeight;
          }}
          className="mt-3 self-end rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-medium text-blue-300 font-[Poppins] hover:bg-blue-500/20 transition-colors"
        >
          Voltar ao final
        </button>
      )}
    </div>
  );
}
