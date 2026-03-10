"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Lock, ChevronDown, Globe } from 'lucide-react';

export default function NeonLanding() {
  
  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30 font-sans">
      
      {/* Selector Limba */}
      <div className="absolute top-6 right-6 z-50">
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-all text-sm">
          <Globe size={14} />
          <span>RO / EN</span>
        </button>
      </div>

      {/* HERO SECTION */}
      <section className="relative h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10"
        >
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-medium tracking-[0.2em] uppercase bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400">
            Acces Privat • 2026
          </span>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            NEON.
          </h1>
          <p className="max-w-xl mx-auto text-lg md:text-xl text-zinc-400 font-light leading-relaxed mb-10">
            Unii doar privesc. Alții fac parte din poveste. <br />
            O experiență digitală privată, dincolo de algoritmi.
          </p>
          
          <button 
            onClick={scrollToPricing}
            className="group relative px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
          >
            <span className="relative z-10">VERIFICĂ DISPONIBILITATEA</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10"
        >
          <ChevronDown className="text-zinc-600" />
        </motion.div>
      </section>

      {/* PROOF SECTION */}
      <section className="py-32 px-4 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12">
          {[
            { icon: <Lock className="text-purple-500" />, title: "100% Anonim", desc: "Identitatea ta rămâne a ta. Fără date colectate, fără urme lăsate." },
            { icon: <Zap className="text-blue-500" />, title: "Acces Instant", desc: "Fără timpi de așteptare. Intri în universul NEON în 3 secunde." },
            { icon: <Shield className="text-purple-400" />, title: "Fără Filtru", desc: "Conținut brut, autentic și exclusiv pentru membrii elite." }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.04] transition-colors"
            >
              <div className="mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-zinc-500 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-32 px-4 bg-zinc-950/50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-16">Alege nivelul de acces</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col">
              <h4 className="text-zinc-400 mb-2">Curious</h4>
              <div className="text-4xl font-bold mb-6">$5<span className="text-sm text-zinc-600">/lună</span></div>
              <ul className="text-sm text-zinc-500 space-y-4 mb-8 text-left">
                <li>• Acces la feed-ul de bază</li>
                <li>• Notificări prioritare</li>
              </ul>
              <button className="mt-auto py-3 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all">Selectează</button>
            </div>

            <div className="p-8 bg-purple-600/10 border-2 border-purple-500/50 rounded-[2.5rem] flex flex-col relative scale-105 shadow-[0_0_40px_rgba(147,51,234,0.1)]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Recomandat</div>
              <h4 className="text-purple-400 mb-2 font-semibold">Elite</h4>
              <div className="text-4xl font-bold mb-6">$7<span className="text-sm text-zinc-600">/lună</span></div>
              <ul className="text-sm text-zinc-300 space-y-4 mb-8 text-left">
                <li>• Tot ce e în Curious</li>
                <li>• Conținut privat HD</li>
                <li>• Chat direct cu creatorul</li>
              </ul>
              <button className="mt-auto py-3 bg-purple-500 text-white rounded-full hover:bg-purple-400 transition-all shadow-lg shadow-purple-500/20">Devino Elite</button>
            </div>

            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col">
              <h4 className="text-zinc-400 mb-2">Legend</h4>
              <div className="text-4xl font-bold mb-6">$10<span className="text-sm text-zinc-600">/lună</span></div>
              <ul className="text-sm text-zinc-500 space-y-4 mb-8 text-left">
                <li>• Acces Ultra Premium</li>
                <li>• Întâlniri 1-la-1</li>
                <li>• Badge VIP 'Legend'</li>
              </ul>
              <button className="mt-auto py-3 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all">Alege Legend</button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 text-center text-zinc-600 text-xs tracking-widest uppercase">
        <p>© 2026 NEON DIGITAL • Confidentiality First</p>
      </footer>
    </div>
  );
}
