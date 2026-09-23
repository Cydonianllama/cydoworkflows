import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"

export interface StatCardProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  hint?: string
}

export function StatCard({ label, value, icon, hint }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        {icon ? <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-foreground">{icon}</div> : null}
        <div className="space-y-0.5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold leading-none">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
