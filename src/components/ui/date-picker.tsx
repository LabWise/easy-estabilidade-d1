
import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Selecione uma data",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(date || new Date());
  const [yearInput, setYearInput] = React.useState<string>("");
  const [showYearInput, setShowYearInput] = React.useState(false);

  // Auto-select date when clicked, but keep OK button for confirmation
  const handleDateSelect = (newDate: Date | undefined) => {
    setSelectedDate(newDate);
    if (newDate) {
      // Auto-apply the date immediately
      onDateChange(newDate);
      // Close the popover after a brief delay for visual feedback
      setTimeout(() => setOpen(false), 150);
    }
  };

  const handleConfirm = () => {
    onDateChange(selectedDate);
    setOpen(false);
  };

  const handleCancel = () => {
    setSelectedDate(date);
    setOpen(false);
  };

  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year);
    if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
      const newDate = new Date(currentMonth);
      newDate.setFullYear(yearNum);
      setCurrentMonth(newDate);
      setShowYearInput(false);
      setYearInput("");
    }
  };

  const handleYearInputSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleYearChange(yearInput);
    } else if (e.key === 'Escape') {
      setShowYearInput(false);
      setYearInput("");
    }
  };

  // Update selectedDate when date prop changes
  React.useEffect(() => {
    setSelectedDate(date);
    if (date) {
      setCurrentMonth(date);
    }
  }, [date]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          {/* Header com navegação de ano */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setFullYear(newDate.getFullYear() - 1);
                setCurrentMonth(newDate);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              {showYearInput ? (
                <Input
                  type="number"
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value)}
                  onKeyDown={handleYearInputSubmit}
                  onBlur={() => {
                    if (yearInput) {
                      handleYearChange(yearInput);
                    } else {
                      setShowYearInput(false);
                    }
                  }}
                  className="w-20 h-8 text-center"
                  placeholder={currentMonth.getFullYear().toString()}
                  autoFocus
                  min="1900"
                  max="2100"
                />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowYearInput(true);
                    setYearInput(currentMonth.getFullYear().toString());
                  }}
                  className="font-semibold"
                >
                  {currentMonth.getFullYear()}
                </Button>
              )}
              
              <Select
                value={currentMonth.getMonth().toString()}
                onValueChange={(month) => {
                  const newDate = new Date(currentMonth);
                  newDate.setMonth(parseInt(month));
                  setCurrentMonth(newDate);
                }}
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {format(new Date(2024, i, 1), "MMMM", { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setFullYear(newDate.getFullYear() + 1);
                setCurrentMonth(newDate);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          locale={ptBR}
          className="pointer-events-auto"
        />
        
        <div className="flex justify-end gap-2 p-3 border-t">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleConfirm}>
            <Check className="w-4 h-4 mr-1" />
            OK
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
