import logo from "@/assets/logo.svg";

export function ChatTypingDots() {
  return (
    <div className="flex gap-3 mb-6 px-2">
      <div className="flex-shrink-0 mt-1">
        <div className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-700 p-0.5 flex items-center justify-center shadow">
          <img src={logo} alt="Bot" className="w-full h-full object-contain" />
        </div>
      </div>
      <div className="bg-[#2a2a2a] border border-neutral-700 px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex items-center gap-1.5 h-5">
          <span
            className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
            style={{ animationDelay: "160ms" }}
          />
          <span
            className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
            style={{ animationDelay: "320ms" }}
          />
        </div>
      </div>
    </div>
  );
}
