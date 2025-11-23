import type { RecurrenceRule } from './types';

/**
 * Calculate the timestamp for the next occurrence of a recurring task
 * 
 * @param baseDate The date to calculate from (usually the scheduled date of the completed task)
 * @param rule The recurrence rule
 * @param from Optional timestamp to use as the "current" time (defaults to now) - mainly for logic that depends on completion time
 * @returns The timestamp for the next occurrence, or null if recurrence has ended
 */
export function getNextOccurrenceTimestamp(
  baseDate: number,
  rule: RecurrenceRule,
  from?: number
): number | null {
  const nowTs = from ?? Date.now();

  // Respect end date
  if (rule.endsAt && nowTs > rule.endsAt) {
    return null;
  }

  const interval = Math.max(rule.interval || 1, 1);

  // Logic:
  // For daily/weekly/monthly/yearly, we typically want to preserve the "schedule" relative to the original date.
  // However, if the user completes a task very late (e.g. a daily task from 3 days ago), 
  // we usually want the next one to be tomorrow relative to *completion* (or today relative to completion + interval),
  // OR we want it to catch up.
  //
  // For this MVP, let's use a hybrid approach:
  // 1. Calculate next candidate based on baseDate
  // 2. If that candidate is in the past, jump forward to the next future slot relative to baseDate pattern
  //    (This preserves "every Monday" even if you missed 3 Mondays)
  
  // But we should respect if it had time. For now, assume date-granularity is primary.
  
  // Determine the anchor date for calculation
  let anchorDate: number;
  if (rule.basis === 'completion') {
     anchorDate = nowTs;
  } else {
     // basis is 'scheduled' (default)
     anchorDate = baseDate;
  }

  const anchor = new Date(anchorDate);
  // Use anchor for calculation
  
  let next: Date;

  // Helper to advance date
  const advance = (d: Date, count: number = 1) => {
    const result = new Date(d);
    switch (rule.frequency) {
      case 'daily':
        result.setDate(result.getDate() + (interval * count));
        break;
      case 'weekdays': {
        // Add days, skipping weekends
        // Simple implementation: add 1 day at a time and check
        let added = 0;
        while (added < (interval * count)) {
          result.setDate(result.getDate() + 1);
          const day = result.getDay();
          if (day !== 0 && day !== 6) { // 0=Sun, 6=Sat
            added++;
          }
        }
        break;
      }
      case 'weekly':
        result.setDate(result.getDate() + (7 * interval * count));
        break;
      case 'monthly': {
        // Handle month edge cases (e.g. Jan 31 -> Feb 28/29)
        // setMonth handles this by rolling over, which might not be desired.
        // Better behavior: maintain day of month if possible.
        const targetDay = anchor.getDate();
        result.setMonth(result.getMonth() + (interval * count));
        
        // If we rolled over (e.g. Jan 31 + 1 month -> March 3), clamp back to end of month
        if (result.getDate() !== targetDay) {
          // This means the target month didn't have enough days.
          // Go to the last day of the previous month (which is the correct month)
          result.setDate(0); 
        }
        break;
      }
      case 'yearly': {
        const targetMonth = anchor.getMonth();
        result.setFullYear(result.getFullYear() + (interval * count));
        
        // Handle leap year edge case (Feb 29 -> Feb 28 in non-leap years)
        if (result.getMonth() !== targetMonth) {
           result.setDate(0);
        }
        break;
      }
    }
    return result;
  };

  // Calculate next occurrence
  // Start from base and advance until we are in the future relative to now (or at least today)
  // However, some users prefer "next one is tomorrow" regardless of schedule.
  // Tasky's design seems to favor "scheduled date". 
  // Let's try to find the first occurrence > baseDate that is also >= today (if overdue).
  // Actually, simpler: find first occurrence > baseDate.
  // If that is in the past, keep advancing until > nowTs?
  // Or just strict schedule? 
  // Strict schedule is better for "every Monday". If I miss last Monday, completing it today should verify if I want to do "this Monday" (which might be today or past) or "next Monday".
  //
  // DECISION: "Strict Schedule" (Next slot after baseDate).
  // But if that slot is waaaay in the past (e.g. task from last year), we might want to skip to now.
  // Let's stick to Strict Schedule for consistency first. 
  // But we must ensure we advance at least once from baseDate.
  
  next = advance(anchor, 1);
  
  // Optimization: If the calculated next is still far in the past (e.g. recurring daily from 2020), 
  // loop to catch up to *today* so we don't generate 1000 tasks one by one.
  // But only if it's WAY in the past. For "Every Monday" and I missed 2, I probably want the next one to be "Next Monday", not "Today".
  
  if (next.getTime() < nowTs) {
     // It's in the past.
     
     // If basis is 'completion', next will effectively be > nowTs (since anchor is nowTs), so we don't enter here.
     // If basis is 'scheduled', we want to catch up to the next future slot.
     
     // Remove the special "Daily/Weekdays" override that reset to "Today".
     // Rely purely on the loop to find the next valid slot.
     // This ensures that if I missed yesterday's task and complete it today,
     // strict schedule (daily) will find Today as the next slot (if current time is before scheduled time?)
     // Wait, advance(yesterday, 1) -> Today.
     // If Today < Now (e.g. 9am < 10am), loop will advance to Tomorrow.
     // This effectively skips Today's instance. 
     // Is that desired?
     // If I have "Daily Standup 9am".
     // I miss Monday. I do it Tuesday 10am.
     // Next should be Tuesday 9am (Missed) -> Catch up -> Wednesday 9am?
     // If I say "I did Monday's standup", Tuesday's is still pending.
     // Ideally I should see Tuesday's standup immediately.
     // But if "Tuesday 9am" is in the past relative to "Tuesday 10am", strict catchup will skip it.
     // 
     // To fix this "skip today" issue for strictly scheduled daily tasks:
     // We probably want `next` to be the first occurrence that is > (now - some threshold)?
     // Or just accept that if you complete it late, the "next" one is the one *after* now.
     // 
     // Let's keep the simple "catch up to future" logic for now as it's standard for "strict" recurrence.
     
     while (next.getTime() < nowTs) {
         next = advance(next, 1);
     }
  }

  const nextTs = next.getTime();
  
  // Final check on end date
  if (rule.endsAt && nextTs > rule.endsAt) {
    return null;
  }

  return nextTs;
}
