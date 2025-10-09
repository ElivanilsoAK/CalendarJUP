import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type DateButtonProps = {
  date: Date;
  isSelected?: boolean;
  isToday?: boolean;
  isHoliday?: boolean;
  isWeekend?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
};

export function DateButton({
  date,
  isSelected,
  isToday,
  isHoliday,
  isWeekend,
  onClick,
  children,
}: DateButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-full h-24 p-2 border border-transparent text-sm
        ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'}
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${isWeekend ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
        ${isHoliday ? 'bg-red-50 dark:bg-red-900/20' : ''}
        hover:bg-gray-50 dark:hover:bg-gray-700/50
        transition-colors duration-200
      `}
    >
      <time
        dateTime={format(date, 'yyyy-MM-dd')}
        className={`
          absolute top-2 right-2 text-sm
          ${isWeekend || isHoliday ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}
        `}
      >
        {format(date, 'd')}
      </time>
      {children}
    </button>
  );
}

type CalendarHeaderProps = {
  date: Date;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onToday?: () => void;
};

export function CalendarHeader({
  date,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {format(date, 'MMMM yyyy', { locale: ptBR })}
      </h2>
      <div className="flex items-center space-x-2">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          Hoje
        </button>
        <div className="flex items-center rounded-md shadow-sm">
          <button
            onClick={onPrevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-md border border-r-0"
          >
            <span className="sr-only">Mês anterior</span>
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={onNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-md border border-l-0"
          >
            <span className="sr-only">Próximo mês</span>
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}