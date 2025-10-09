import React from 'react';
import { isSameDay, getDay } from 'date-fns';
import type { Holiday, Plantonista } from '../utils/calendarLogic';
import { Card } from './ui/Card';

interface Day {
  date: Date;
  plantonista: Plantonista | null;
}

interface CalendarViewProps {
  calendar: Day[];
  holidays: Holiday[];
  year: number;
  month: number;
  companyName: string;
  logoUrl:string;
  primaryColor: string;
  plantonistas: Plantonista[]; // Full list of available plantonistas
  onAssignmentChange: (date: Date, newPlantonistaId: string | null) => void; // Callback for changes
}

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const CalendarView: React.FC<CalendarViewProps> = ({
  calendar,
  holidays,
  year,
  month,
  companyName,
  logoUrl,
  primaryColor,
  plantonistas,
  onAssignmentChange,
}) => {

  if (calendar.length === 0) {
    return null;
  }

  const firstDay = new Date(year, month, 1);
  const emptyDays = Array.from(
    { length: getDay(firstDay) },
    (_, i) => ({
      date: new Date(year, month, -i),
      plantonista: null
    })
  ).reverse();

  return (
    <div>
      <Card className="w-full max-w-6xl mx-auto p-0" id="calendar-to-export">
        <div className="relative">
          {/* Watermark */}
          {logoUrl && (
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <img src={logoUrl} alt={companyName} className="max-w-[50%] max-h-[50%] object-contain" />
            </div>
          )}

          {/* Calendar Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>{monthNames[month]} {year}</h2>
              <h3 className="text-lg text-gray-600 dark:text-gray-400">{companyName}</h3>
            </div>
            {logoUrl && <img src={logoUrl} alt="Logo" className="h-12" />}
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
            {weekDays.map((day) => (
              <div
                key={day}
                className="bg-gray-50 dark:bg-gray-800 p-3 text-center font-medium"
                style={{ color: primaryColor }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
            {emptyDays.map((_, index) => (
              <div
                key={`empty-${index}`}
                className="bg-white dark:bg-gray-800 min-h-[120px]"
              />
            ))}

            {calendar.map(({ date, plantonista }) => {
              const isToday = isSameDay(date, new Date());
              const holidayInfo = holidays.find(h => isSameDay(new Date(h.date), date));
              const dayOfMonth = date.getDate();
              const isShiftDay = plantonista || holidayInfo || getDay(date) === 0 || getDay(date) === 6;

              return (
                <div key={date.toString()} className="relative pt-2 pr-2 pb-16 pl-2 bg-white dark:bg-gray-900 border-r border-b border-gray-200 dark:border-gray-700 min-h-[120px]">
                  <div className={`absolute top-2 right-2 text-sm ${isToday ? 'font-bold text-blue-600 bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-500 dark:text-gray-400'}`}>
                    {dayOfMonth}
                  </div>

                  {isShiftDay && (
                    <div className="mt-8">
                      <select
                        value={plantonista?.id || ''}
                        onChange={(e) => onAssignmentChange(date, e.target.value || null)}
                        className="w-full p-1 text-xs border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">- Sem plantonista -</option>
                        {plantonistas.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {holidayInfo && (
                    <div className="absolute bottom-2 left-2 text-xs text-red-600 font-semibold truncate" title={holidayInfo.name}>
                      {holidayInfo.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CalendarView;