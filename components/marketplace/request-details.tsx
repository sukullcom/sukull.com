import type { ServiceRequestAnswer } from "@/db/schema";

export function RequestDetails({ answers, details }: { answers: ServiceRequestAnswer[]; details: string }) {
  return (
    <section className="mk-card space-y-3 p-4 text-sm">
      {answers.map((answer) => (
        <p key={answer.id}>
          <span className="block text-muted-foreground">{answer.prompt}</span>
          <span className="font-semibold">{answer.answer}</span>
        </p>
      ))}
      <p>
        <span className="block text-muted-foreground">Müşterinin anlattıkları</span>
        <span className="whitespace-pre-wrap font-semibold">{details}</span>
      </p>
    </section>
  );
}
