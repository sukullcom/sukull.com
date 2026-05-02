import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type Props = {
    title: string;
}

export const Header = ({ title }: Props) => {
    return (
        <div className="sticky top-0 z-40 bg-background max-lg:pt-2 pb-3 lg:pt-[28px] lg:mt-[-28px] flex items-center justify-between border-b-2 border-border mb-5">
            <Link prefetch={false} href="/courses">
                <Button>
                    <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                </Button>
            </Link>
            <h1 className="font-bold text-lg text-foreground">
                {title}
            </h1>
            <div />
        </div>
    )
}