// app/snippets/snippets-list.tsx
// No "use client" here
import { getAllSnippets } from "@/db/queries";

export default async function SnippetsList({ search }: { search?: string }) {
  const allSnippets = await getAllSnippets({ search });

  if (!allSnippets || allSnippets.length === 0) {
    return <div className="text-gray-300">Kod bulunamadı.</div>;
  }

  return (
    <div className="grid gap-4 mt-4">
      {allSnippets.map(snippet => (
        <div key={snippet.id} className="bg-[#1e1e2e] p-4 rounded-lg border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-1">{snippet.title}</h2>
          <p className="text-sm text-gray-400 mb-2">by {snippet.userName}</p>
          <p className="text-sm text-gray-300 mb-2 italic">Language: {snippet.language}</p>
          <p className="text-gray-200">{snippet.description}</p>
          <pre className="mt-3 bg-[#121212] p-3 rounded text-xs text-gray-100 overflow-x-auto">
            {snippet.code}
          </pre>
        </div>
      ))}
    </div>
  );
}
