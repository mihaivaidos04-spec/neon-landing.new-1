import { redirect } from "next/navigation";

/**
 * Catch-all: rute necunoscute sunt redirecționate către pagina principală.
 */
export default function NotFound() {
  redirect("/");
}
