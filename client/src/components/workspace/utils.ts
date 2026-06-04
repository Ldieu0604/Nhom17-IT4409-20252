export function dateLabel(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa đặt";
}

export function dateInputValue(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
