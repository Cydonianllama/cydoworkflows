import { useWorkflowsActions } from "../actions/useWorkflowsActions"
import { WORKFLOW_NAME_MAX_LENGTH } from "../catalog/workflowsCatalog"
import { WorkflowNameDialog } from "../components/WorkflowNameDialog/WorkflowNameDialog"

export interface WorkflowsCreateCompositionProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WorkflowsCreateComposition({ open, onOpenChange }: WorkflowsCreateCompositionProps) {
  const { createWorkflowAction, creating } = useWorkflowsActions()

  return (
    <WorkflowNameDialog
      open={open}
      loading={creating}
      maxLength={WORKFLOW_NAME_MAX_LENGTH}
      onOpenChange={onOpenChange}
      onSubmit={async (name) => {
        const ok = await createWorkflowAction(name)
        if (ok) onOpenChange(false)
      }}
    />
  )
}
