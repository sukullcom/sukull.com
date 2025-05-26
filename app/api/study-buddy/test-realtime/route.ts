import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { message, chatId } = await request.json();

    const supabase = await createClient();
    
    // Insert a test message
    const { data, error } = await supabase
      .from("study_buddy_messages")
      .insert([
        {
          chat_id: chatId,
          sender: user.id,
          content: message,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error inserting test message:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in test realtime:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 