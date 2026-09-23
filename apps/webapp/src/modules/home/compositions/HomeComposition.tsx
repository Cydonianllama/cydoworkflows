import { Users, Workflow } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@cydo/auth/client"
import { useHomeActions } from "../actions/useHomeActions"
import { StatCard } from "../components/StatCard"
import { WelcomeBanner } from "../components/WelcomeBanner"

export function HomeComposition() {
  const { user } = useAuth()
  const { overview, loading } = useHomeActions()

  return (
    <div className="space-y-6">
      <WelcomeBanner name={user?.profile.name ?? ""} jobRole={overview?.user.profile.jobRole} />

      <div className="grid gap-4 sm:grid-cols-2">
        {loading && !overview ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            <StatCard label="Workflows" value={overview?.stats.workflows ?? 0} icon={<Workflow className="h-5 w-5" />} />
            <StatCard
              label="Miembros"
              value={overview?.stats.members ?? 1}
              icon={<Users className="h-5 w-5" />}
              hint={overview?.user.profile.expectedUsers ? `Objetivo: ${overview.user.profile.expectedUsers}` : undefined}
            />
          </>
        )}
      </div>
    </div>
  )
}
