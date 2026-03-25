import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Formats a date using the user's preferred timezone and date format.
 * Can be called outside of React components using Zustand's getState().
 */
export function formatUserDate(
  date: string | Date | null | undefined,
  options?: { includeTime?: boolean },
): string {
  if (!date) return '—';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';

  const { timezone, dateFormat } = useSettingsStore.getState().preferences.display;
  const tz = timezone || 'UTC';
  const fmt = dateFormat || 'MM/DD/YYYY';

  try {
    // Build Intl.DateTimeFormat options based on preferred format
    const dateOpts: Intl.DateTimeFormatOptions = {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    const timeOpts: Intl.DateTimeFormatOptions = options?.includeTime
      ? { hour: '2-digit', minute: '2-digit', hour12: false }
      : {};

    const parts = new Intl.DateTimeFormat('en-US', { ...dateOpts, ...timeOpts }).formatToParts(d);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

    const year = get('year');
    const month = get('month');
    const day = get('day');

    let formatted: string;
    switch (fmt) {
      case 'DD/MM/YYYY':
        formatted = `${day}/${month}/${year}`;
        break;
      case 'YYYY-MM-DD':
        formatted = `${year}-${month}-${day}`;
        break;
      case 'MM/DD/YYYY':
      default:
        formatted = `${month}/${day}/${year}`;
        break;
    }

    if (options?.includeTime) {
      const hour = get('hour');
      const minute = get('minute');
      formatted += ` ${hour}:${minute}`;

      // Append timezone abbreviation for clarity
      try {
        const tzAbbr = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
          .formatToParts(d)
          .find((p) => p.type === 'timeZoneName')?.value;
        if (tzAbbr) formatted += ` ${tzAbbr}`;
      } catch { /* skip tz abbreviation if unsupported */ }
    }

    return formatted;
  } catch {
    // Fallback if timezone is invalid
    return d.toLocaleDateString();
  }
}

/** React hook version that causes re-render when preferences change */
export function useFormatDate() {
  const timezone = useSettingsStore((s) => s.preferences.display.timezone);
  const dateFormat = useSettingsStore((s) => s.preferences.display.dateFormat);
  return (date: string | Date | null | undefined, opts?: { includeTime?: boolean }) =>
    formatUserDate(date, opts);
}
