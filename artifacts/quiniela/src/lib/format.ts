import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(dateString?: string | null) {
  if (!dateString) return "Fecha por definir";
  try {
    return format(parseISO(dateString), "dd MMM, yyyy • HH:mm", { locale: es });
  } catch (e) {
    return "Fecha inválida";
  }
}

export function formatShortDate(dateString?: string | null) {
  if (!dateString) return "-";
  try {
    return format(parseISO(dateString), "dd/MMM", { locale: es });
  } catch (e) {
    return "-";
  }
}
