// Returns local date string in YYYY-MM-DD format
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Returns local time string in HH:mm (24-hour) format
export function getLocalTimeString(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Checks whether a single content item should appear right now
export function isContentScheduledNow(item, now = new Date()) {
  if (!item || item.isActive === false) {
    return false;
  }

  const today = getLocalDateString(now);
  const currentTime = getLocalTimeString(now);

  // Date range check (inclusive)
  if (item.startDate && today < item.startDate) {
    return false;
  }
  if (item.endDate && today > item.endDate) {
    return false;
  }

  // Time range check (inclusive)
  if (item.startTime && currentTime < item.startTime) {
    return false;
  }
  if (item.endTime && currentTime > item.endTime) {
    return false;
  }

  return true;
}

// Filters content items for a specific screen ("ALL" matches everything assigned to ALL or that screen)
export function getActiveScreenContents(contents, targetScreenId = "ALL", now = new Date()) {
  const normalizedTarget = (targetScreenId || "ALL").trim().toUpperCase();

  return contents.filter((item) => {
    const itemScreen = (item.screenId || "ALL").trim().toUpperCase();
    const matchesScreen =
      normalizedTarget === "ALL" ||
      itemScreen === "ALL" ||
      itemScreen === normalizedTarget;

    return matchesScreen && isContentScheduledNow(item, now);
  });
}

// Basic URL safety check for external image links
export function isSafeImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}