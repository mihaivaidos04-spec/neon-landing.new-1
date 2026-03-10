\"use client\";

import React from \"react\";
import { motion } from \"framer-motion\";
import { Shield, Zap, Lock, ChevronDown, Globe } from \"lucide-react\";

const scrollToPricing = () => {
  if (typeof document === \"undefined\") return;
  document.getElementById(\"pricing\")?.scrollIntoView({ behavior: \"smooth\" });
};

export default function NeonLanding() {
  return (
    <div className=\"relative min-h-screen bg-black text-white selection:bg-purple-500/30 font-sans\">
      {/* Language selector */}
      <div className=\"absolute top-6 right-6 z-50\">
        <button className=\"flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-all text-sm\">
          <Globe size={14} />
          <span>RO / EN</span>
        </button>
      </div>

      {/* Hero section */}
      <section className=\"relative h-screen flex flex-col items-center justify-center px-4 overflow-hidden\">
        {/* Background glow */}
        <div className=\"absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/20 blur-[120px]\" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className=\"z-10 text-center\"
        >
          <span className=\"mb-6 inline-block rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-purple-400\">
            Acces Privat • 2026
          </span>

          <h1 className=\"mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-6xl font-bold tracking-tighter text-transparent md:text-8xl\">
            NEON.
          </h1>

          <p className=\"mx-auto mb-10 max-w-xl text-lg font-light leading-relaxed text-zinc-400 md:text-xl\">
            Unii doar privesc. Alții fac parte din poveste.
            <br />
            O experiență digitală privată, dincolo de algoritmi.
          </p>

          <button
            onClick={scrollToPricing}
            className=\"group relative overflow-hidden rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition-all hover:scale-105 active:scale-95\"
          >
            <span className=\"relative z-10\">VERIFICĂ DISPONIBILITATEA</span>
            <div className=\"absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-r from-purple-400 to-blue-400\" />
          </button>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className=\"absolute bottom-10\"
        >
          <ChevronDown className=\"text-zinc-600\" />
        </motion.div>
      </section>

      {/* Proof section */}
      <section className=\"max-w-6xl mx-auto px-4 py-24 md:py-32\">
        <div className=\"grid gap-10 md:grid-cols-3\">
          {[
            {
              icon: <Lock className=\"text-purple-500\" />,
              title: \"100% Anonim\",
              desc: \"Identitatea ta rămâne a ta. Fără date colectate, fără urme lăsate.\"
            },
            {
              icon: <Zap className=\"text-blue-500\" />,
              title: \"Acces Instant\",
              desc: \"Fără timpi de așteptare. Intri în universul NEON în 3 secunde.\"
            },
            {
              icon: <Shield className=\"text-purple-400\" />,
              title: \"Fără Filtru\",
              desc: \"Conținut brut, autentic și exclusiv pentru membrii elite.\"
            }
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className=\"rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 transition-colors hover:bg-white/[0.04]\"
            >
              <div className=\"mb-4\">{item.icon}</div>
              <h3 className=\"mb-2 text-xl font-semibold\">{item.title}</h3>
              <p className=\"leading-relaxed text-zinc-500\">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing section */}
      <section id=\"pricing\" className=\"bg-zinc-950/50 px-4 py-24 md:py-32\">
        <div className=\"mx-auto max-w-5xl text-center\">
          <h2 className=\"mb-16 text-3xl font-bold md:text-4xl\">Alege nivelul de acces</h2>

          <div className=\"grid gap-8 md:grid-cols-3\">
            {/* Tier 1 */}
            <div className=\"flex flex-col rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8\">
              <h4 className=\"mb-2 text-sm font-medium text-zinc-400\">Curious</h4>
              <div className=\"mb-6 text-4xl font-bold\">
                $5
                <span className=\"text-sm font-normal text-zinc-600\">/lună</span>
              </div>
              <ul className=\"mb-8 space-y-4 text-left text-sm text-zinc-500\">
                <li>• Acces la feed-ul de bază</li>
                <li>• Notificări prioritare</li>
              </ul>
              <button className=\"mt-auto rounded-full border border-white/10 py-3 text-sm transition-all hover:bg-white hover:text-black\">
                Selectează
              </button>
            </div>

            {/* Tier 2 - Featured */}
            <div className=\"relative flex flex-col rounded-[2.5rem] border-2 border-purple-500/50 bg-purple-600/10 p-8 shadow-[0_0_40px_rgba(147,51,234,0.15)] md:scale-105\">
              <div className=\"absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-purple-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em]\">
                Recomandat
              </div>
              <h4 className=\"mb-2 text-sm font-semibold text-purple-300\">Elite</h4>
              <div className=\"mb-6 text-4xl font-bold\">
                $7
                <span className=\"text-sm font-normal text-zinc-600\">/lună</span>
              </div>
              <ul className=\"mb-8 space-y-4 text-left text-sm text-zinc-200\">
                <li>• Tot ce e în Curious</li>
                <li>• Conținut privat HD</li>
                <li>• Chat direct cu creatorul</li>
              </ul>
              <button className=\"mt-auto rounded-full bg-purple-500 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:bg-purple-400\">
                Devino Elite
              </button>
            </div>

            {/* Tier 3 */}
            <div className=\"flex flex-col rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8\">
              <h4 className=\"mb-2 text-sm font-medium text-zinc-400\">Obsidian</h4>
              <div className=\"mb-6 text-4xl font-bold\">
                Custom
                <span className=\"block text-sm font-normal text-zinc-600\">la cerere</span>
              </div>
              <ul className=\"mb-8 space-y-4 text-left text-sm text-zinc-500\">
                <li>• Arhitectură digitală complet personalizată</li>
                <li>• Sesiuni private 1:1</li>
                <li>• Acces anticipat la experimente NEON</li>
              </ul>
              <button className=\"mt-auto rounded-full border border-white/10 py-3 text-sm transition-all hover:border-purple-400 hover:text-purple-200\">
                Discuție privată
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


