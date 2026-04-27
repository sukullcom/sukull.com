import Image from "next/image";
import { CreateAccountForm } from "./create-account";

export default function CreateAccountPage() {
  return (
    <div className="max-w-[988px] mx-auto flex-1 w-full flex flex-col items-center justify-center p-4 gap-8">
      <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-8">
        <div className="relative aspect-square max-h-[200px] w-full lg:max-w-[200px] shrink-0">
          <Image src="/hero.svg" fill alt="Hero" sizes="100vw" />
        </div>

        <div className="w-full min-w-0 max-w-lg bg-white rounded-3xl border-2 border-gray-200 shadow-xl p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-center mb-6 text-green-500">
            Kayıt Ol
          </h1>
          <CreateAccountForm />
        </div>
      </div>
    </div>
  );
}
