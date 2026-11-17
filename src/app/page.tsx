import Link from "next/link";
import { MyPolls } from "@/components/LocalPolls";

const EXAMPLES = [
  { emoji: "🍕", text: "O que vamos jantar?" },
  { emoji: "✈️", text: "Pra onde vamos viajar?" },
  { emoji: "🏢", text: "Aprovamos a reforma da fachada?" },
  { emoji: "📅", text: "Qual dia fica melhor pra reunião?" },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-5 pt-6 text-center sm:pt-12">
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">Decidam juntos, sem enrolação.</h1>
        <p className="mx-auto max-w-md text-lg text-muted text-balance">
          Crie uma votação em segundos e mande o link no grupo. Ninguém precisa baixar app nem criar conta.
        </p>
        <Link href="/nova" className="btn-primary px-8 py-4 text-base">
          Criar votação
        </Link>
      </section>

      <ul className="grid grid-cols-2 gap-3">
        {EXAMPLES.map((e) => (
          <li key={e.text} className="card flex items-center gap-3 p-4 text-sm sm:p-4">
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
