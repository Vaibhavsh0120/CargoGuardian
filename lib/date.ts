import { format, formatDistanceToNowStrict } from "date-fns";

export function formatDateTime(value: string | null | undefined, fallback = "Unavailable") {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return format(date, "dd MMM yyyy, HH:mm");
}

export function formatRelativeTime(value: string | null | undefined, fallback = "Unavailable") {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return formatDistanceToNowStrict(date, { addSuffix: true });
}
