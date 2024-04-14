import { DateTime } from "luxon";

export const DaysSinceOpened = (openedDate: DateTime): number => {
  const today = DateTime.now();
  const openedDay = openedDate.toJSDate();
  const timeDiff = today.toMillis() - openedDay.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
  return daysDiff;
};
