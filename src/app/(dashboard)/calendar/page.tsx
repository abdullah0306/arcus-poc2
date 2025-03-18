"use client";

import { Fragment, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [currentDate] = useState(new Date());
  const [currentWeek] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 0); // Adjust when today is Sunday
    const sunday = new Date(today.setDate(diff));
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      week.push(date);
    }
    return week;
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const getDayNumber = (date: Date) => {
    return date.getDate();
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="bg-muted h-full flex-1 p-8 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-x-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {formatDate(currentDate)}
          </h1>
          <div className="flex items-center gap-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-x-2">
          <Button
            variant="outline"
            className="h-9 px-4"
            onClick={() => {}}
          >
            Today
          </Button>
          <Button 
            onClick={() => {}}
            className="h-9 px-4 bg-orange-500 hover:bg-orange-600 text-sm font-medium"
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
