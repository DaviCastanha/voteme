import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Rise } from "@/components/motion/Rise";
import { MyPolls } from "@/components/LocalPolls";

const EXAMPLES = [
  { emoji: "🍕", text: "O que vamos jantar?" },
  { emoji: "✈️", text: "Pra onde vamos viajar?" },
  { emoji: "🏢", text: "Aprovamos a reforma da fachada?" },
  { emoji: "📅", text: "Qual dia fica melhor pra reunião?" },
];

export default function Home() {
  return (
    <div className="relative isolate space-y-10">
      <div className="aurora" aria-hidden />

      <section className="space-y-5 pt-6 text-center sm:pt-12">
        <Rise>
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Decidam juntos,{" "}
            <span className="bg-linear-to-r from-accent to-gold bg-clip-text text-transparent">sem enrolação.</span>
          </h1>
        </Rise>
        <Rise i={1}>
          <p className="mx-auto max-w-md text-lg text-muted text-balance">
            Crie uma votação em segundos e mande o link no grupo. Ninguém precisa baixar app nem criar conta.
          </p>
        </Rise>
        <Rise i={2}>
          <Link href="/nova" className="btn-primary group px-8 py-4 text-base">
            Criar votação
            <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Rise>
      </section>

      <ul className="grid grid-cols-2 gap-3">
        {EXAMPLES.map((e, i) => (
          <li
            key={e.text}
            style={{ "--i": 3 + i } as CSSProperties}
            className="card animate-rise flex items-center gap-3 p-4 text-sm transition-[translate,box-shadow] duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-18px_var(--accent)] sm:p-4"
          >
            <span className="text-2xl" aria-hidden>
              {e.emoji}
            </span>
            {e.text}
          </li>
        ))}
      </ul>

      <MyPolls />
    </div>
  );
}
