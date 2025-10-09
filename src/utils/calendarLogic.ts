// src/utils/calendarLogic.ts

// --- Interfaces ---
export interface Plantonista {
  id: string;
  name: string;
  vacations: Vacation[];
}
export interface Vacation {
  id: string;
  startDate: string;
  endDate: string;
}

export interface Holiday {
  date: string;
  name: string;
  type?: string;
}

export interface Day {
  date: Date;
  plantonista: Plantonista | null;
}

// --- Helper Functions ---

export const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(Date.UTC(year, month, 1));
  const days: Date[] = [];
  while (date.getUTCMonth() === month) {
    days.push(new Date(date));
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return days;
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getUTCDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
    return d1.getUTCFullYear() === d2.getUTCFullYear() &&
           d1.getUTCMonth() === d2.getUTCMonth() &&
           d1.getUTCDate() === d2.getUTCDate();
}

export const isHoliday = (date: Date, holidays: Holiday[]): Holiday | undefined => {
  return holidays.find(h => {
    // Dates from API are strings like "2024-01-01". Create Date objects in UTC.
    const holidayDate = new Date(h.date + 'T00:00:00Z');
    return isSameDay(date, holidayDate);
  });
};

export const isOnVacation = (date: Date, vacations: Vacation[]): boolean => {
    return vacations.some(v => {
        if (!v.startDate || !v.endDate) return false;
        // Ensure vacation dates are parsed as UTC
        const startDate = new Date(v.startDate + 'T00:00:00Z');
        const endDate = new Date(v.endDate + 'T23:59:59Z');
        return date >= startDate && date <= endDate;
    });
};

// --- Core Algorithm ---

/**
 * Generates a balanced and fair on-call calendar for a given month.
 *
 * @param year The target year.
 * @param month The target month (0-indexed).
 * @param plantonistas A list of available staff.
 * @param holidays A list of national and custom holidays.
 * @returns An array of Day objects representing the generated calendar.
 */
export const generateCalendar = (
  year: number,
  month: number,
  plantonistas: Plantonista[],
  holidays: Holiday[]
): Day[] => {
  if (plantonistas.length === 0) {
    return getDaysInMonth(year, month).map(day => ({ date: day, plantonista: null }));
  }

  // --- Initialization ---
  const daysInMonth = getDaysInMonth(year, month);
  const calendar: Day[] = daysInMonth.map(date => ({ date, plantonista: null }));

  // Track shift counts for fairness.
  const shiftCounts = new Map<string, number>(plantonistas.map(p => [p.id, 0]));

  // Track the last weekend a person worked to avoid back-to-back weekends.
  const lastWeekendWorked = new Map<string, number>();

  // Shuffle plantonistas to ensure different initial assignments over time.
  const shuffledPlantonistas = [...plantonistas].sort(() => Math.random() - 0.5);

  // --- Assignment Logic ---
  for (let i = 0; i < calendar.length; i++) {
    const day = calendar[i];
    const isShiftDay = isWeekend(day.date) || isHoliday(day.date, holidays);

    if (!isShiftDay) {
      continue;
    }

    // --- Candidate Selection ---
    const candidates = shuffledPlantonistas.filter(p => {
      // Rule 1: Must not be on vacation.
      if (isOnVacation(day.date, p.vacations)) {
        return false;
      }

      // Rule 2: Avoid back-to-back weekends.
      const weekNumber = Math.floor(day.date.getUTCDate() / 7);
      if (isWeekend(day.date) && lastWeekendWorked.get(p.id) === weekNumber - 1) {
          // Check if there are other options before enforcing this rule strictly
          const otherOptionsExist = shuffledPlantonistas.some(op =>
              !isOnVacation(day.date, op.vacations) &&
              lastWeekendWorked.get(op.id) !== weekNumber - 1
          );
          if(otherOptionsExist) return false;
      }

      return true;
    });

    if (candidates.length === 0) {
      // If no one is available (e.g., all on vacation), leave the day unassigned.
      continue;
    }

    // Rule 3: Prioritize the person with the fewest shifts.
    candidates.sort((a, b) => (shiftCounts.get(a.id) ?? 0) - (shiftCounts.get(b.id) ?? 0));
    
    const chosenPlantonista = candidates[0];
    day.plantonista = chosenPlantonista;

    // --- Update Tracking ---
    shiftCounts.set(chosenPlantonista.id, (shiftCounts.get(chosenPlantonista.id) ?? 0) + 1);
    if (isWeekend(day.date)) {
        const weekNumber = Math.floor(day.date.getUTCDate() / 7);
        lastWeekendWorked.set(chosenPlantonista.id, weekNumber);
    }
  }

  // --- Post-processing for Holiday Bridges ---
  // If a holiday is adjacent to a weekend, assign the same person to the holiday.
  for (let i = 0; i < calendar.length; i++) {
    const currentDay = calendar[i];
    if (isHoliday(currentDay.date, holidays) && !isWeekend(currentDay.date)) {
      const prevDay = i > 0 ? calendar[i - 1] : null;
      const nextDay = i < calendar.length - 1 ? calendar[i + 1] : null;

      // Holiday is on a Friday, adjacent to a Saturday.
      if (nextDay && isWeekend(nextDay.date) && nextDay.plantonista) {
        currentDay.plantonista = nextDay.plantonista;
      }
      // Holiday is on a Monday, adjacent to a Sunday.
      else if (prevDay && isWeekend(prevDay.date) && prevDay.plantonista) {
        currentDay.plantonista = prevDay.plantonista;
      }
    }
  }

  return calendar;
};