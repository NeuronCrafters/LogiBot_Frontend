import { GoDownload } from "react-icons/go";
import { exportHighQualityCard } from "@/utils/exportCard";
import { useRef } from "react";

interface ChartExportMenuProps {
  containerId: string;
  fileName: string;
  className?: string;
}

export function ChartExportMenu({ containerId, fileName, className }: ChartExportMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const handleExportClick = async () => {
    try {
      await exportHighQualityCard(containerId, fileName);
    } catch (error) {
    }
  };

  return (
    <div ref={menuRef} className={`relative ${className || ""}`}>
      <button
        className="p-2 bg-white/10 rounded hover:bg-white/20"
        onClick={handleExportClick}
      >
        <GoDownload className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
