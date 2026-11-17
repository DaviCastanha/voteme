import type { Metadata } from "next";
import { CreatePollForm } from "@/components/CreatePollForm";

export const metadata: Metadata = { title: "Nova votação" };

export default function NewPollPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">Nova votação</h1>
      <CreatePollForm />
    </div>
  );
}
