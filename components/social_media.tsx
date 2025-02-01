import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export const SocialMediaLinks = () => {
  const socials = [
    {
      name: "YouTube",
      icon: "/youtube-icon.svg",
      url: "https://youtube.com/@ornekkanal",
      text: "Eğitim videolarımızı izleyin"
    },
    {
      name: "Discord",
      icon: "/discord-icon.svg",
      url: "https://discord.gg/orneksunucu",
      text: "Topluluğa katılın"
    },
    {
      name: "Slack",
      icon: "/slack-icon.svg",
      url: "https://ornekslack.slack.com",
      text: "Takımla iletişim kurun"
    },
    {
      name: "Instagram",
      icon: "/instagram-icon.svg",
      url: "https://instagram.com/ornekhesap",
      text: "Güncellemeleri takip edin"
    }
  ];

  return (
    <div className="border-2 rounded-xl p-6 space-y-4">
      <h3 className="font-bold text-lg mb-4">Bize Katılın</h3>
      
      <div className="space-y-3">
        {socials.map((social) => (
          <Link 
            href={social.url} 
            key={social.name}
            target="_blank"
            rel="noopener noreferrer"
            prefetch={false}
          >
            <Button 
              variant="default" 
              className="w-full flex items-center justify-start mt-4 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <Image
                src={social.icon}
                alt={social.name}
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <div className="flex-1 text-left">
                <p className="font-medium text-neutral-700">{social.name}</p>
                <p className="text-xs text-muted-foreground">{social.text}</p>
              </div>
              <span className="text-gray-400">→</span>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
};