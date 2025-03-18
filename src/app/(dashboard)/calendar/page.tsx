"use client";

import { Fragment, useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, addWeeks, format, startOfWeek, subWeeks } from "date-fns";
import { CalendarIcon } from "@/components/ui/calendar-icon";

interface TimeSlot {
  time: string;
  displayTime: string;
}

const timeSlots: TimeSlot[] = [
  { time: "9AM", displayTime: "9 AM" },
  { time: "10AM", displayTime: "10 AM" },
  { time: "11AM", displayTime: "11 AM" },
  { time: "12PM", displayTime: "12 PM" },
  { time: "1PM", displayTime: "1 PM" },
  { time: "2PM", displayTime: "2 PM" },
  { time: "3PM", displayTime: "3 PM" },
  { time: "4PM", displayTime: "4 PM" },
  { time: "5PM", displayTime: "5 PM" },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    const startDay = startOfWeek(today);
    return Array.from({ length: 7 }, (_, i) => addDays(startDay, i));
  });

  const goToPreviousWeek = () => {
    const newDate = subWeeks(currentDate, 1);
    setCurrentDate(newDate);
    updateWeek(newDate);
  };

  const goToNextWeek = () => {
    const newDate = addWeeks(currentDate, 1);
    setCurrentDate(newDate);
    updateWeek(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    updateWeek(today);
  };

  const updateWeek = (date: Date) => {
    const startDay = startOfWeek(date);
    setCurrentWeek(Array.from({ length: 7 }, (_, i) => addDays(startDay, i)));
  };

  const formatMonthYear = () => {
    return format(currentDate, "MMMM yyyy");
  };

  const formatWeekRange = () => {
    const firstDay = currentWeek[0];
    const lastDay = currentWeek[6];
    return `Week ${format(firstDay, "w")}, ${format(firstDay, "MMM d")} - ${format(lastDay, "MMM d")}, ${format(lastDay, "yyyy")}`;
  };

  const getDayNumber = (date: Date) => {
    return date.getDate();
  };

  const getDayName = (date: Date) => {
    return format(date, "EEE");
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
  };

  return (
    <div className="bg-muted h-full flex-1 p-8 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-x-3">
          <div className="relative flex items-center justify-center w-[68px]">
            <div className="absolute">
              <CalendarIcon 
                month={format(currentDate, "MMM").toUpperCase()} 
                date={currentDate.getDate()} 
              />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold tracking-tight">
              {formatMonthYear()}
            </h1>
            <div className="text-sm text-muted-foreground">
              Week {format(currentWeek[0], "w")}, {format(currentWeek[0], "MMM d")} - {format(currentWeek[6], "MMM d")}, {format(currentWeek[6], "yyyy")}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-x-2">
          <Button
            variant="outline"
            className="h-9"
            onClick={goToPreviousWeek}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-9 px-4"
            onClick={goToToday}
          >
            Today
          </Button>
          <Button
            variant="outline"
            className="h-9"
            onClick={goToNextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => {}}
            className="h-9 px-4 bg-orange-500 hover:bg-orange-600 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add event
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-md border shadow-sm flex-1 flex flex-col min-h-0">
        {/* Single scrollable container */}
        <div className="flex-1 overflow-y-auto">
          <div>
            {/* Sticky header row */}
            <div className="grid grid-cols-8 sticky top-0 bg-white z-10">
              <div className="border-r border-b py-2 px-4">
                <span className="text-sm font-medium text-gray-500">Time</span>
              </div>
              {currentWeek.map((date) => (
                <div 
                  key={date.toISOString()}
                  className={`py-2 px-4 text-center border-r border-b ${isToday(date) ? "bg-orange-50" : ""}`}
                >
                  <div className="text-sm font-medium text-gray-500">{getDayName(date)}</div>
                  <div className={`text-lg font-medium mt-1 ${isToday(date) ? "text-orange-500" : ""}`}>
                    {getDayNumber(date)}
                  </div>
                </div>
              ))}
            </div>

            {/* Time slots grid */}
            <div className="grid grid-cols-8">
              {timeSlots.map((slot) => (
                <Fragment key={slot.time}>
                  <div className="border-r h-20 px-4 flex items-start pt-2 border-b">
                    <span className="text-sm text-gray-500">{slot.displayTime}</span>
                  </div>
                  {currentWeek.map((date) => (
                    <div 
                      key={`${date.toISOString()}-${slot.time}`}
                      className={`border-r h-20 border-b ${isToday(date) ? "bg-orange-50" : ""}`}
                    />
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
