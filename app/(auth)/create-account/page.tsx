import Image from "next/image";
import { CreateAccountForm } from "./create-account";

export default function CreateAccountPage() {
  return (
    <div className="max-w-[988px] mx-auto flex-1 w-full flex flex-col items-center justify-center p-4 gap-8">
      <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-10">
        <div className="relative mx-auto aspect-square w-40 shrink-0 sm:w-48 lg:w-56">
          <Image
            src="/hero.svg"
            fill
            alt="Sukull"
            className="object-contain"
            sizes="(max-width: 640px) 160px, (max-width: 1024px) 192px, 224px"
            priority
          />
        </div>

        <div className="w-full min-w-0 max-w-md bg-white rounded-3xl border-2 border-gray-200 shadow-xl p-6 sm:p-7">
          <h1 className="text-3xl font-bold text-center mb-6 text-green-500">
            Kayıt Ol
          </h1>
          <CreateAccountForm />
        </div>
      </div>
    </div>
  );
}
