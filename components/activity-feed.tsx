import { CheckCircle2, Clock3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityItem } from "@/lib/types"

type ActivityFeedProps = {
  activities: ActivityItem[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Hoạt động gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{activity.actor}</span> {activity.action}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  {activity.createdAtLabel}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
