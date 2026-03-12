import Link from "next/link";

export const metadata = {
  title: "Termeni și Condiții | NEON",
  description: "Termenii și condițiile de utilizare ale platformei NEON.",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-white/60 underline hover:text-white/90"
        >
          ← Înapoi
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Termeni și Condiții
        </h1>
        <p className="mt-2 text-sm text-white/60">Ultima actualizare: 2026</p>

        <div className="mt-10 space-y-10 text-white/90">
          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Vârsta Minimă
            </h2>
            <p className="mt-3 leading-relaxed">
              Accesul la platformă este strict interzis persoanelor sub 18 ani.
              Utilizând NEON, confirmați că aveți vârsta legală minimă. Ne
              rezervăm dreptul de a verifica vârsta și de a închide orice cont
              care încalcă această condiție.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Politica „Fără Rambursări”
            </h2>
            <p className="mt-3 leading-relaxed">
              „Bănuții” și accesul VIP sunt bunuri digitale consumabile
              instantaneu. O dată ce plata a fost procesată și creditul a fost
              adăugat în cont, <strong>nu oferim returnări</strong> sau
              rambursări. Achiziționați doar dacă sunteți de acord cu această
              politică.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Comportament
            </h2>
            <p className="mt-3 leading-relaxed">
              Este interzisă înregistrarea altor utilizatori fără consimțământ,
              hărțuirea, conținutul ilegal sau orice comportament abuziv. În caz
              de încălcare, contul poate fi suspendat sau șters instant, fără
              dreptul la returnarea creditelor sau a sumelor plătite.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Moneda Virtuală (Bănuți)
            </h2>
            <p className="mt-3 leading-relaxed">
              „Bănuții” sunt o monedă virtuală internă și{" "}
              <strong>nu au valoare monetară reală</strong>. Nu pot fi
              schimbați înapoi în bani lichizi (cash) sau retrași. Sunt
              utilizabili exclusiv în cadrul platformei NEON, conform
              funcționalităților oferite (cadouri, filtre etc.).
            </p>
          </section>
        </div>

        <p className="mt-14 text-center text-xs text-white/40">
          © 2026 NEON Interactive. Toate drepturile rezervate.
        </p>
      </div>
    </div>
  );
}
