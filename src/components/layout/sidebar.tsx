import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, MessageSquare, Folder, Bookmark, Settings, Compass, Crosshair } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { getRecentChats } from "@/app/actions/chat";

export async function Sidebar() {
  const recentChats = await getRecentChats();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Crosshair className="h-5 w-5" />
          </div>
          <span className="text-primary tracking-wider uppercase">ROG AI</span>
        </div>
      </div>
      
      <Separator />
      
      <div className="p-4">
        <Button className="w-full justify-start gap-2 shadow-sm font-semibold" variant="default">
          <PlusCircle className="h-4 w-4" />
          New Study Session
        </Button>
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
            <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-tight text-muted-foreground">
              Recent Chats
            </h2>
            <div className="space-y-1">
              {recentChats.length === 0 ? (
                <div className="text-sm text-muted-foreground px-2 py-2">No recent chats</div>
              ) : (
                recentChats.map((chat) => (
                  <Button key={chat.id} variant="ghost" className="w-full justify-start gap-2 font-normal text-muted-foreground hover:text-foreground">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="truncate">{chat.title}</span>
                  </Button>
                ))
              )}
            </div>
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
