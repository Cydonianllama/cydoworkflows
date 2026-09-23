import { useCallback, useEffect, useState } from "react"
import { useConfirm } from "@/features/confirm/ConfirmProvider"
import type { WorkflowVersionSummaryDTO } from "@/lib/api/workflows"
import { useFlowchartActions } from "../actions/useFlowchartActions"
import { useFlowchartStore } from "../store"
import { VersionDialog } from "../components/VersionDialog/VersionDialog"

export interface VersionDialogCompositionProps {
  open: boolean
  onOpenChange(open: boolean): void
  disabled?: boolean
}

export function VersionDialogComposition({
  open,
  onOpenChange,
  disabled = false,
}: VersionDialogCompositionProps) {
  const { hasUnpublishedChanges, dirty } = useFlowchartStore()
  const { listVersionsAction, restoreVersionAction } = useFlowchartActions()
  const confirm = useConfirm()
  const [versions, setVersions] = useState<WorkflowVersionSummaryDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false

    setLoading(true)
    void listVersionsAction().then((items) => {
      if (cancelled) return
      setVersions(items ?? [])
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [open, listVersionsAction])

  const handleRestore = useCallback(
    async (version: number) => {
      if (hasUnpublishedChanges || dirty) {
        const accepted = await confirm({
          title: `¿Restaurar la versión v${version}?`,
          description: "Tienes cambios sin publicar que serán reemplazados por esta versión.",
          confirmLabel: "Restaurar",
          cancelLabel: "Cancelar",
          destructive: true,
        })
        if (!accepted) return
      }

      setRestoringVersion(version)
      try {
        const ok = await restoreVersionAction(version)
        if (ok) onOpenChange(false)
      } finally {
        setRestoringVersion(null)
      }
    },
    [hasUnpublishedChanges, dirty, confirm, restoreVersionAction, onOpenChange],
  )

  return (
    <VersionDialog
      open={open}
      onOpenChange={onOpenChange}
      versions={versions}
      loading={loading}
      restoringVersion={restoringVersion}
      disabled={disabled}
      onRestore={(version) => void handleRestore(version)}
    />
  )
}
