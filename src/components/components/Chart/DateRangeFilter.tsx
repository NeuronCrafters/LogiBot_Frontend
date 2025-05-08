import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { DateRange } from "react-day-picker";

interface DateRangeFilterProps {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

function DateRangeFilter({ dateRange, setDateRange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>({
    from: dateRange?.from,
    to: dateRange?.to,
  });

  const handleSelect = (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) return;

    setTempRange(range);
    setDateRange(range);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white">Período</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal bg-[#2a2a2a] border-neutral-700 text-white hover:bg-[#333333]"
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-white" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy")
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 bg-[#181818] border border-neutral-700"
          align="start"
          side="bottom"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Calendar
            mode="range"
            selected={tempRange}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="rounded-md text-white"
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DateRangeFilter };
