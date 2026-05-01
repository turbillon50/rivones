import { useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

interface BookedRange {
  startDate: string;
  endDate: string;
}

interface Props {
  bookedRanges: BookedRange[];
  blockedDates: string[];
  selectedRange: { from?: Date; to?: Date };
  onSelect: (range: { from?: Date; to?: Date }) => void;
  minDays?: number;
}

/**
 * Date-range picker that visually disables host-blocked dates and dates that
 * fall inside an existing booking. Used by the booking page (renter side) and
 * by the host availability page.
 */
export function AvailabilityCalendar({ bookedRanges, blockedDates, selectedRange, onSelect, minDays }: Props) {
  const disabledDates = useMemo(() => {
    const set = new Set<string>();
    for (const range of bookedRanges) {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        set.add(d.toISOString().slice(0, 10));
      }
    }
    for (const d of blockedDates) set.add(d);
    return Array.from(set).map(s => new Date(s));
  }, [bookedRanges, blockedDates]);

  return (
    <div className="rdp-rivones rounded-2xl border border-border bg-card p-3">
      <DayPicker
        mode="range"
        numberOfMonths={1}
        disabled={[...disabledDates, { before: new Date() }]}
        selected={selectedRange.from ? { from: selectedRange.from, to: selectedRange.to } : undefined}
        onSelect={(range) => onSelect(range ?? {})}
        min={minDays}
        showOutsideDays
        weekStartsOn={1}
      />
      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary"/>Seleccionado</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30"/>No disponible</span>
      </div>
    </div>
  );
}
