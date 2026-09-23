import { useCallback, useState } from "react"
import { useConfirm } from "@/features/confirm/ConfirmProvider"
import { useFlowchartActions } from "../actions/useFlowchartActions"
import { useFlowchartStore } from "../store"
import { FlowchartHeader, type FlowchartHeaderBadgeVariant } from "../components/FlowchartHeader/FlowchartHeader"
import { VersionDialogComposition } from "./VersionDialogComposition"

function buildBadge(
  status: "draft" | "published",
  version: number,
  hasUnpublishedChanges: boolean,
  dirty: boolean,
): { variant: FlowchartHeaderBadgeVariant; label: string } {
  if (status === "draft") {
    return { variant: "outline", label: "Borrador" }
  }
  if (hasUnpublishedChanges || dirty) {
    return { variant: "warning", label: `Publicado v${version} · cambios` }
  }
  return { variant: "success", label: `Publicado v${version}` }
}

export function FlowchartHeaderComposition() {
  const {
    workflowName,
    status,
    version,
    hasUnpublishedChanges,
    dirty,
    publishing,
  } = useFlowchartStore()
  const { renameWorkflowAction, publishWorkflowAction, revertChangesAction, loading } =
    useFlowchartActions()
  const confirm = useConfirm()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)
  const [versionsOpen, setVersionsOpen] = useState(false)

  const handleEdit = useCallback(() => {
    setDraft(workflowName)
    setEditing(true)
  }, [workflowName])

  const handleCancel = useCallback(() => {
    setDraft("")
    setEditing(false)
  }, [])

  const handleSave = useCallback(async () => {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === workflowName) {
      setEditing(false)
      return
    }

    setSaving(true)
    try {
      const ok = await renameWorkflowAction(trimmed)
      if (ok) setEditing(false)
    } finally {
      setSaving(false)
    }
  }, [draft, workflowName, renameWorkflowAction])

  const handlePublish = useCallback(() => {
    void publishWorkflowAction()
  }, [publishWorkflowAction])

  const handleOpenVersions = useCallback(() => {
    setVersionsOpen(true)
  }, [])

  const canRevert = version > 0 && (hasUnpublishedChanges || dirty)

  const handleRevert = useCallback(async () => {
    const accepted = await confirm({
      title: "¿Revertir cambios?",
      description: "Se descartarán los cambios no publicados y volverás a la última versión publicada.",
      confirmLabel: "Revertir",
      cancelLabel: "Cancelar",
      destructive: true,
    })
    if (!accepted) return
    await revertChangesAction()
  }, [confirm, revertChangesAction])

  const showPublish = status === "draft" || hasUnpublishedChanges || dirty
  const publishLabel = showPublish ? (status === "draft" ? "Publicar" : "Actualizar") : null

  return (
    <>
      <FlowchartHeader
        name={workflowName}
        editing={editing}
        draft={draft}
        saving={saving}
        badge={buildBadge(status, version, hasUnpublishedChanges, dirty)}
        publishLabel={publishLabel}
        publishing={publishing}
        showRevert={canRevert}
        onEdit={handleEdit}
        onDraftChange={setDraft}
        onSave={() => void handleSave()}
        onCancel={handleCancel}
        onPublish={handlePublish}
        onOpenVersions={handleOpenVersions}
        onRevert={() => void handleRevert()}
      />
      <VersionDialogComposition
        open={versionsOpen}
        onOpenChange={setVersionsOpen}
        disabled={loading || publishing}
      />
    </>
  )
}
