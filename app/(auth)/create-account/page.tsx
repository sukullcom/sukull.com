import Image from "next/image";
import { CreateAccountForm } from "./create-account";

export default function CreateAccountPage() {
  return (
    // Outer container
    <div className="max-w-[988px] mx-auto flex-1 flex flex-col lg:flex-row items-center justify-center p-4 gap-2">
      {/* ----- Left side image */}
      <div className="relative aspect-square max-h-[200px] w-full">
        <Image src="/hero.svg" fill alt="Hero" sizes="100vw" />
      </div>

      {/* ----- Right side form container */}
      <div className="w-full max-w-md bg-white rounded-3xl border-2 border-gray-200 shadow-xl p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-500">
          Kayıt Ol
        </h1>
        {/* The actual form */}
        <CreateAccountForm />
      </div>
    </div>
  );
}
