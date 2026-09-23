import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { hasNodeAction } from "../../nodes/nodeActions"
import { ParametersEditors } from "../ParametersEditors/ParametersEditors"
import type { NodeParameterEntry, NodeParameterField } from "../../nodes/types"
import type { NodeDialogProps } from "./nodeDialogProps"

type DialogTab = "parameters" | "settings"

function ColumnHeader({ label }: { label: string }) {
  return (
    <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
  )
}

function EmptyColumn({ label }: { label: string }) {
  return (
    <div className="scrollbar-thin flex h-full min-h-0 flex-col overflow-y-auto border border-dashed border-border p-4">
      <ColumnHeader label={label} />
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">—</div>
    </div>
  )
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  )
}

function readParameterValues(configuration: unknown): NodeParameterEntry[] {
  if (configuration && typeof configuration === "object" && "parameters" in configuration) {
    const params = (configuration as { parameters?: unknown }).parameters
    if (Array.isArray(params)) return params as NodeParameterEntry[]
  }
  return []
}

function ParametersPanel({
  node,
  configuration,
  parameters,
  onUpdateConfiguration,
  parameterErrors,
}: {
  node: NonNullable<NodeDialogProps["node"]>
  configuration: unknown
  parameters: NodeParameterField[] | undefined
  onUpdateConfiguration: NodeDialogProps["onUpdateConfiguration"]
  parameterErrors: Record<string, string> | undefined
}) {
  const values = useMemo(() => readParameterValues(configuration), [configuration])

  if (!parameters || parameters.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Sin parámetros configurables todavía.
      </div>
    )
  }

  const handleChange = (next: NodeParameterEntry[]) => {
    if (!onUpdateConfiguration) return
    onUpdateConfiguration(node.id, { parameters: next })
  }

  return (
    <ParametersEditors
      fields={parameters}
      values={values}
      errors={parameterErrors}
      onChange={handleChange}
    />
  )
}

function SettingsPanel({
  node,
  actions,
  onRenameNode,
}: {
  node: NonNullable<NodeDialogProps["node"]>
  actions: NodeDialogProps["actions"]
  onRenameNode: NodeDialogProps["onRenameNode"]
}) {
  const [title, setTitle] = useState(node.title)
  const canRename = hasNodeAction(actions, "rename")

  useEffect(() => {
    setTitle(node.title)
  }, [node.id, node.title])

  if (!canRename) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Sin acciones disponibles.
      </div>
    )
  }

  const trimmed = title.trim()
  const dirty = trimmed !== node.title && trimmed.length > 0

  const commit = () => {
    if (!dirty || !onRenameNode) return
    onRenameNode(node.id, trimmed)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="node-rename" className="text-xs font-medium text-foreground">
          Nombre del nodo
        </label>
        <div className="flex gap-2">
          <Input
            id="node-rename"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit()
            }}
            placeholder="Nombre del nodo"
            className="h-8 text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!dirty}
            onClick={commit}
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  )
}

function CurrentColumn({
  node,
  actions,
  onRenameNode,
  configuration,
  parameters,
  onUpdateConfiguration,
  parameterErrors,
}: {
  node: NonNullable<NodeDialogProps["node"]>
  actions: NodeDialogProps["actions"]
  onRenameNode: NodeDialogProps["onRenameNode"]
  configuration: unknown
  parameters: NodeParameterField[] | undefined
  onUpdateConfiguration: NodeDialogProps["onUpdateConfiguration"]
  parameterErrors: Record<string, string> | undefined
}) {
  const [tab, setTab] = useState<DialogTab>("parameters")

  useEffect(() => {
    setTab("parameters")
  }, [node.id])

  return (
    <div className="relative z-10 flex h-full min-h-0 flex-col border border-border bg-card shadow-md">
      <div className="shrink-0 border-b border-border px-4 pb-3 pt-4">
        <div className="truncate text-sm font-semibold text-foreground" title={node.title}>
          {node.title}
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{node.type}</div>
      </div>

      <div className="flex shrink-0 border-b border-border px-1">
        <TabButton
          active={tab === "parameters"}
          label="Parameters"
          onClick={() => setTab("parameters")}
        />
        <TabButton
          active={tab === "settings"}
          label="Settings"
          onClick={() => setTab("settings")}
        />
      </div>

      <div className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        {tab === "parameters" ? (
          <ParametersPanel
            node={node}
            configuration={configuration}
            parameters={parameters}
            onUpdateConfiguration={onUpdateConfiguration}
            parameterErrors={parameterErrors}
          />
        ) : (
          <SettingsPanel node={node} actions={actions} onRenameNode={onRenameNode} />
        )}
      </div>
    </div>
  )
}

export function NodeDialog({
  open,
  node,
  prev,
  next,
  onClose,
  actions,
  onRenameNode,
  configuration,
  parameters,
  onUpdateConfiguration,
  parameterErrors,
}: NodeDialogProps) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  if (!open || !node) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex h-[90vh] w-[90vw] max-w-[90vw] flex-col rounded-lg border border-border bg-background px-0 py-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Configuración de ${node.title}`}
      >
        <button
          type="button"
          className="absolute right-4 top-4 z-10 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-3 px-4 md:grid-cols-[1fr_1.5fr_1fr]">
          <EmptyColumn label="Anterior" />
          <CurrentColumn
            node={node}
            actions={actions}
            onRenameNode={onRenameNode}
            configuration={configuration}
            parameters={parameters}
            onUpdateConfiguration={onUpdateConfiguration}
            parameterErrors={parameterErrors}
          />
          {next ? (
            <EmptyColumn label="Siguiente" />
          ) : (
            <div className="hidden md:block" />
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
