import { redirect } from "next/navigation";
import EditorPanel from "./components/editor-panel";
import Header from "./components/header";
import OutputPanel from "./components/output-panel";

export default async function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto p-4">
        <Header />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EditorPanel />
          <OutputPanel />
        </div>
      </div>
    </div>
  );
}
