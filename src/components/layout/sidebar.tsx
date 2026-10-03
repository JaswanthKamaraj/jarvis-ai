import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, MessageSquare, Folder, Bookmark, Settings, Compass, Crosshair } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { getRecentChats } from "@/app/actions/chat";
import { RecentChatsList } from "./recent-chats-list";

export async function Sidebar() {
  const recentChats = await getRecentChats();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg shadow-[0_0_15px_rgba(30,144,255,0.35)] bg-gradient-to-br from-[#0B6FD6] to-[#0A0F1C] text-white border border-[#1E90FF]/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#00D4FF] drop-shadow-[0_0_8px_rgba(0,212,255,0.8)]"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          </div>
          <span className="text-primary tracking-wider uppercase">JARVIS AI</span>
        </div>
      </div>
      
      <Separator />
      
      <div className="p-4">
        <a href="/" className="block w-full">
          <Button className="w-full justify-start gap-2 font-semibold bg-gradient-to-r from-[#0B6FD6] to-[#1E90FF] shadow-[0_0_15px_rgba(30,144,255,0.35)] border-0 hover:from-[#1E90FF] hover:to-[#3AA0FF] text-white" variant="default">
            <PlusCircle className="h-4 w-4" />
            New Study Session
          </Button>
        </a>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4">
          <div className="py-2">
            <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-tight text-muted-foreground">
              Discover
            </h2>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Compass className="h-4 w-4" />
                Explore Topics
              </Button>
            </div>
          </div>
          
          <div className="py-2">
            <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-tight text-muted-foreground">
              My Library
            </h2>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Folder className="h-4 w-4" />
                Subjects
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Bookmark className="h-4 w-4" />
                Saved Notes
              </Button>
            </div>
          </div>
          
          <div className="py-2">
            <RecentChatsList initialChats={recentChats} />
          </div>
        </div>
      </ScrollArea>
      
      <Separator />
      
      {/* Footer Profile & Settings */}
      <div className="p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
