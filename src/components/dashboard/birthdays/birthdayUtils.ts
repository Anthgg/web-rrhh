import {
  differenceInCalendarDays,
  format,
  isBefore,
  lastDayOfMonth,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";

import type { BirthdayWorker } from "@/types";

export interface BirthdayWorkerWithMeta extends BirthdayWorker {
  birthMonth: number;
  birthDay: number;
  nextBirthday: Date;
  daysUntilBirthday: number;
  isToday: boolean;
}

interface CurrentUserMatcher {
  id?: string;
  fullName?: string;
}

const FALLBACK_REFERENCE_YEAR = 2000;

export function hasValidBirthday(birthday?: string | null): birthday is string {
  return Boolean(birthday && /^\d{4}-\d{2}-\d{2}$/.test(birthday));
}

export function getBirthdayParts(birthday: string) {
  const [, month, day] = birthday.split("-").map(Number);
  return {
    monthIndex: Math.max(0, month - 1),
    day: Math.max(1, day),
  };
}

export function getBirthdayMonthDayKey(birthday: string) {
  const { monthIndex, day } = getBirthdayParts(birthday);
  return `${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getBirthdayOccurrence(birthday: string, year: number) {
  const { monthIndex, day } = getBirthdayParts(birthday);
  const monthDate = new Date(year, monthIndex, 1);
  const maxDay = lastDayOfMonth(monthDate).getDate();
  return startOfDay(new Date(year, monthIndex, Math.min(day, maxDay)));
}

export function getNextBirthdayDate(birthday: string, today = new Date()) {
  const base = startOfDay(today);
  const currentYearBirthday = getBirthdayOccurrence(birthday, base.getFullYear());

  if (isBefore(currentYearBirthday, base)) {
    return getBirthdayOccurrence(birthday, base.getFullYear() + 1);
  }

  return currentYearBirthday;
}

export function getDaysUntilBirthday(birthday: string, today = new Date()) {
  return differenceInCalendarDays(getNextBirthdayDate(birthday, today), startOfDay(today));
}

export function isBirthdayToday(birthday: string, today = new Date()) {
  return getDaysUntilBirthday(birthday, today) === 0;
}

export function formatBirthdayDate(birthday: string) {
  const { monthIndex, day } = getBirthdayParts(birthday);
  return format(new Date(FALLBACK_REFERENCE_YEAR, monthIndex, day), "d 'de' MMMM", { locale: es });
}

export function formatBirthdayOccurrenceDate(date: Date) {
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
}

export function formatBirthdayMonthLabel(monthIndex: number) {
  return format(new Date(FALLBACK_REFERENCE_YEAR, monthIndex, 1), "MMMM", { locale: es });
}

export function getRelativeBirthdayLabel(daysUntilBirthday: number) {
  if (daysUntilBirthday === 0) return "Hoy";
  if (daysUntilBirthday === 1) return "Manana";
  return `En ${daysUntilBirthday} dias`;
}

export function enhanceBirthdayWorker(
  worker: BirthdayWorker,
  today = new Date(),
): BirthdayWorkerWithMeta {
  const { monthIndex, day } = getBirthdayParts(worker.birthday);
  const nextBirthday = getNextBirthdayDate(worker.birthday, today);
  const daysUntilBirthday = getDaysUntilBirthday(worker.birthday, today);

  return {
    ...worker,
    birthMonth: monthIndex,
    birthDay: day,
    nextBirthday,
    daysUntilBirthday,
    isToday: daysUntilBirthday === 0,
  };
}

export function compareBirthdayMonthDay(a: BirthdayWorker, b: BirthdayWorker) {
  const first = getBirthdayParts(a.birthday);
  const second = getBirthdayParts(b.birthday);

  if (first.monthIndex !== second.monthIndex) {
    return first.monthIndex - second.monthIndex;
  }

  if (first.day !== second.day) {
    return first.day - second.day;
  }

  return a.fullName.localeCompare(b.fullName, "es");
}

export function sortBirthdaysByNearest(workers: BirthdayWorker[], today = new Date()) {
  return workers
    .filter((worker) => hasValidBirthday(worker.birthday))
    .map((worker) => enhanceBirthdayWorker(worker, today))
    .sort((a, b) => {
      if (a.daysUntilBirthday !== b.daysUntilBirthday) {
        return a.daysUntilBirthday - b.daysUntilBirthday;
      }

      return a.fullName.localeCompare(b.fullName, "es");
    });
}

export function sortBirthdaysByMonthDay(workers: BirthdayWorker[]) {
  return [...workers].sort(compareBirthdayMonthDay);
}

export function filterBirthdaysByDay(workers: BirthdayWorker[], date: Date) {
  const key = format(date, "MM-dd");
  return workers.filter((worker) => getBirthdayMonthDayKey(worker.birthday) === key);
}

export function filterBirthdaysByMonth(workers: BirthdayWorker[], monthIndex: number) {
  return workers.filter((worker) => getBirthdayParts(worker.birthday).monthIndex === monthIndex);
}

export function getBirthdayDepartments(workers: BirthdayWorker[]) {
  return [...new Set(workers.map((worker) => worker.department).filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), "es"),
  ) as string[];
}

export function matchesCurrentUser(worker: BirthdayWorker, currentUser?: CurrentUserMatcher | null) {
  if (!currentUser) return Boolean(worker.isCurrentUser);

  if (currentUser.id && worker.id === currentUser.id) {
    return true;
  }

  if (!currentUser.fullName) return Boolean(worker.isCurrentUser);

  return worker.fullName.trim().toLowerCase() === currentUser.fullName.trim().toLowerCase();
}

export function dedupeBirthdayWorkers(workers: BirthdayWorker[]) {
  const seen = new Set<string>();

  return workers.filter((worker) => {
    const key = `${worker.id || worker.fullName}-${worker.birthday}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
