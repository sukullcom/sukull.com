import { Footer } from "./footer";
import { Header } from "./header";


type Props = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Üstte header */}
      <Header />
      {/* Ortada sayfa içeriği */}
      <main className="flex-1 flex items-center justify-center bg-white">
        {children}
      </main>
      {/* Altta footer */}
      <Footer />
    </div>
  );
}
