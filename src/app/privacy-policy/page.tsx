import Link from "next/link";

export const metadata = {
  title: "Politica de Confidențialitate | NEON",
  description: "Politica de confidențialitate și protecția datelor NEON.",
};

export default function PrivacyPolicyPage() {
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
          Politica de Confidențialitate
        </h1>
        <p className="mt-2 text-sm text-white/60">Ultima actualizare: 2026</p>

        <div className="mt-10 space-y-10 text-white/90">
          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Colectarea Datelor
            </h2>
            <p className="mt-3 leading-relaxed">
              Colectăm doar datele necesare pentru autentificare și securitate:
              adresa de email și numele furnizate prin autentificare socială
              (Google, Apple etc.), precum și adresa IP pentru prevenirea
              abuzurilor și asigurarea securității platformei. Nu vindem și nu
              partajăm aceste date cu terți în scopuri de marketing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Video Streaming
            </h2>
            <p className="mt-3 leading-relaxed">
              Fluxul video este transmis direct între participanți (Peer-to-Peer,
              P2P) și <strong>nu este înregistrat</strong> și{" "}
              <strong>nu este stocat</strong> pe serverele noastre. Anonimatul
              utilizatorilor este prioritatea noastră principală. Nu păstrăm
              înregistrări video ale conversațiilor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Cookies
            </h2>
            <p className="mt-3 leading-relaxed">
              Folosim cookie-uri esențiale pentru a menține sesiunea de logare și
              pentru a salva preferințele legate de balanța de „Bănuți” și
              setările contului. Aceste cookie-uri sunt necesare pentru
              funcționarea corectă a serviciului și nu sunt folosite pentru
              publicitate sau urmărire terță.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white sm:text-xl">
              Drepturile Utilizatorului (Conform GDPR)
            </h2>
            <p className="mt-3 leading-relaxed">
              Aveți dreptul la acces, rectificare și ștergerea datelor. Puteți
              solicita ștergerea contului și a tuturor datelor asociate printr-un
              singur click din setările contului. După confirmare, vom șterge
              permanent toate datele personale din bazele noastre, în conformitate
              cu Regulamentul General privind Protecția Datelor (GDPR).
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
