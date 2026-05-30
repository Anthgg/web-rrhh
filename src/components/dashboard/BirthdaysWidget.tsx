"use client";

import type { BirthdayWorker } from "@/types";

import { BirthdayCard } from "@/components/dashboard/birthdays/BirthdayCard";

export function BirthdaysWidget({ birthdays }: { birthdays: BirthdayWorker[] }) {
  return <BirthdayCard birthdays={birthdays} />;
}
