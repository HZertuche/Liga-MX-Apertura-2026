import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

const TZ = "America/Mexico_City";

export function formatDate(dateString?: string | null) {
  if (!dateString) return "Fecha por definir";
  try {
    return formatInTimeZone(new Date(dateString), TZ, "dd MMM, yyyy • HH:mm", { locale: es });
  } catch (e) {
    return "Fecha inválida";
  }
}

export function formatShortDate(dateString?: string | null) {
  if (!dateString) return "-";
  try {
    return formatInTimeZone(new Date(dateString), TZ, "dd/MMM", { locale: es });
  } catch (e) {
    return "-";
  }
}
