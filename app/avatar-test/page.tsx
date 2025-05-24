"use client";

import { useState } from "react";
import { AvatarGenerator } from "random-avatar-generator";
import { Button } from "@/components/ui/button";

export default function AvatarTestPage() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const generateAvatar = () => {
    try {
      const generator = new AvatarGenerator();
      const newAvatarUrl = generator.generateRandomAvatar();
      console.log("Generated avatar URL:", newAvatarUrl);
      setAvatarUrl(newAvatarUrl);
      setError(null);
    } catch (err) {
      console.error("Error generating avatar:", err);
      setError("Avatar oluşturulurken bir hata oluştu.");
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8">Avatar Generator Test</h1>
      
      <div className="mb-6">
        <Button 
          onClick={generateAvatar} 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Generate Random Avatar
        </Button>
      </div>
      
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}
      
      {avatarUrl && (
        <div className="flex flex-col items-center">
          <div className="w-64 h-64 border-2 border-gray-300 rounded-lg overflow-hidden mb-4">
            <img 
              src={avatarUrl} 
              alt="Generated Avatar" 
              className="w-full h-full object-cover"
              onError={() => {
                setError("Failed to load avatar image");
              }}
            />
          </div>
          <div className="text-sm break-all max-w-md">
            <p className="font-semibold">Generated URL:</p>
            <p className="bg-gray-100 p-2 rounded">{avatarUrl}</p>
          </div>
        </div>
      )}
    </div>
  );
} 