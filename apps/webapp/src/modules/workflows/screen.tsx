import { useAuth } from "@cydo/auth/client"
import { useState } from "react"
import { PageHeader } from "@/components/PageHeader"
import { canWriteWorkflows } from "@/utils/permissions"
import { WorkflowsCreateComposition } from "./compositions/WorkflowsCreateComposition"
import { WorkflowsTableComposition } from "./compositions/WorkflowsTableComposition"
import { WorkflowsToolbarComposition } from "./compositions/WorkflowsToolbarComposition"
import { WorkflowsStoreProvider } from "./store"

function WorkflowsView() {
  const { user } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)
  const canWrite = canWriteWorkflows(user)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflows"
        description="Crea, busca y organiza los workflows de tu cuenta."
      />

      <WorkflowsToolbarComposition canCreate={canWrite} onCreate={() => setCreateOpen(true)} />
      <WorkflowsTableComposition canDelete={canWrite} onCreate={() => setCreateOpen(true)} />
      <WorkflowsCreateComposition open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

/** Vista principal del módulo workflows. */
export function WorkflowsScreen() {
  return (
    <WorkflowsStoreProvider>
      <WorkflowsView />
    </WorkflowsStoreProvider>
  )
}
