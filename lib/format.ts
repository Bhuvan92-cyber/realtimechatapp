// Format an ISO/SQLite timestamp into a short, human-readable time label.
// The backend returns UTC timestamps; we render them in the user's local time.
export function formatTime(iso: string): string {
  const date = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Initials for an avatar bubble, e.g. "Alice" -> "A", "bob smith" -> "BS".
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
