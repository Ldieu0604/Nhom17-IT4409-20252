"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Circle, MessageCircle, Users, X } from "lucide-react"
import { ActivityItem } from "@/lib/types"

type ChatPanelProps = {
  activities?: ActivityItem[]
}

export function ChatPanel({ activities = [] }: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = useMemo(() => activities.length, [activities.length])

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="icon" className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg">
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Activity và Presence
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="border-b bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Realtime state</p>
              <p className="text-xs text-muted-foreground">
                Panel này là vị trí hợp lý để gắn Socket.IO cho presence, online users và activity feed.
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="rounded-xl border p-3">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{activity.actor}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      <Circle className="mr-1 h-2.5 w-2.5 fill-primary text-primary" />
                      live
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.action}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{activity.createdAtLabel}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Chưa có activity mới. Khi tích hợp Socket.IO, feed này sẽ cập nhật realtime.
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
