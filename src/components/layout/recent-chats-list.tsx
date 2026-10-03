"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash2, X } from "lucide-react";
import { deleteChat, clearAllChats } from "@/app/actions/chat";

export function RecentChatsList({ initialChats }: { initialChats: any[] }) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(id);
    try {
      await deleteChat(id);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to clear all recent chats?")) {
      await clearAllChats();
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-tight text-muted-foreground">
          Recent Chats
        </h2>
        {initialChats.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {initialChats.length === 0 ? (
        <div className="text-sm text-muted-foreground px-2 py-2">No recent chats</div>
      ) : (
        initialChats.map((chat) => (
          <div key={chat.id} className="group relative w-full">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 font-normal text-muted-foreground hover:text-foreground pr-10"
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="truncate">{chat.title}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-40 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              onClick={(e) => handleDelete(chat.id, e)}
              disabled={isDeleting === chat.id}
            >
              {isDeleting === chat.id ? (
                <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
