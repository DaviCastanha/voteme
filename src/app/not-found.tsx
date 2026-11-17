import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card space-y-3 text-center">
      <h1 className="text-xl font-bold">Não encontramos essa votação</h1>
      <p className="text-muted">O link pode estar incompleto ou a votação foi removida.</p>
      <Link href="/nova" className="btn-primary">
        Criar uma votação
      </Link>
    </div>
  );
}
