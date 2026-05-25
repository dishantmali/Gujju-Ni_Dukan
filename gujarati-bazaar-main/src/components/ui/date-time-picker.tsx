import React from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar } from './calendar';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  value: string; // "YYYY-MM-DDThh:mm" or "YYYY-MM-DD"
  onChange: (value: string) => void;
  className?: string;
  type?: 'date' | 'datetime-local';
}

export function DateTimePicker({ value, onChange, className, type = 'datetime-local' }: DateTimePickerProps) {
  const date = value ? new Date(value) : undefined;

  const handleSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    
    if (type === 'datetime-local') {
      if (date) {
        selectedDate.setHours(date.getHours());
        selectedDate.setMinutes(date.getMinutes());
      } else {
        selectedDate.setHours(12);
        selectedDate.setMinutes(0);
      }
      onChange(format(selectedDate, "yyyy-MM-dd'T'HH:mm"));
    } else {
      // Just date
      onChange(format(selectedDate, "yyyy-MM-dd"));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value; 
    if (!timeValue || !date) return;
    const [hours, minutes] = timeValue.split(':');
    const newDate = new Date(date);
    newDate.setHours(parseInt(hours, 10));
    newDate.setMinutes(parseInt(minutes, 10));
    onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center justify-between w-full px-3.5 py-3 bg-[var(--bg-main)] hover:bg-muted/50 border border-[var(--border)] rounded-xl outline-none focus:border-[var(--brown-mid)] transition-colors text-sm text-left font-medium",
            !date && "text-muted-foreground",
            className
          )}
        >
          {date ? (
            type === 'datetime-local' ? format(date, "MMM d, yyyy - h:mm a") : format(date, "PPP")
          ) : (
            <span>{type === 'datetime-local' ? 'Select Date & Time' : 'Select Date'}</span>
          )}
          <CalendarIcon className="h-4 w-4 opacity-70 text-primary" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-card rounded-2xl shadow-lift border border-border overflow-hidden z-[9999]" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          className="p-3 pointer-events-auto"
        />
        {type === 'datetime-local' && (
          <div className="p-3 border-t border-border flex items-center justify-between gap-3 bg-muted/30">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <Clock className="w-4 h-4" />
              <span>Time</span>
            </div>
            <input
              type="time"
              value={date ? format(date, "HH:mm") : ""}
              onChange={handleTimeChange}
              className="px-2.5 py-1.5 border border-border rounded-lg bg-background text-sm font-semibold focus:border-accent outline-none hover:border-border/80 transition-colors cursor-pointer"
              disabled={!date}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
