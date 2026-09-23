import { StickyNote } from "lucide-react"
import { NodeResizer, type NodeProps } from "@xyflow/react"
import { NodeDeleteButton } from "../../components/NodeDeleteButton/NodeDeleteButton"
import type {
  FlowchartRfNode,
  INode,
  NodeDefinition,
  NoteColor,
  NoteConfiguration,
} from "../types"
import { renameNodeAction } from "../nodeActions"

export const NOTE_DEFAULT_WIDTH = 220
export const NOTE_DEFAULT_HEIGHT = 140
export const NOTE_DEFAULT_COLOR: NoteColor = "amber"

const NOTE_COLORS: NoteColor[] = ["amber", "red", "green", "purple", "blue"]

const NOTE_STYLES: Record<
  NoteColor,
  {
    border: string
    bg: string
    headerBorder: string
    icon: string
    title: string
    body: string
    placeholder: string
  }
> = {
  amber: {
    border: "border-amber-300/80 dark:border-amber-500/40",
    bg: "bg-amber-100 dark:bg-amber-950/60",
    headerBorder: "border-amber-300/60 dark:border-amber-500/30",
    icon: "text-amber-700 dark:text-amber-400",
    title: "text-amber-800 dark:text-amber-300",
    body: "text-amber-950 dark:text-amber-100",
    placeholder: "text-amber-700/60 dark:text-amber-400/50",
  },
  red: {
    border: "border-red-300/80 dark:border-red-500/40",
    bg: "bg-red-100 dark:bg-red-950/60",
    headerBorder: "border-red-300/60 dark:border-red-500/30",
    icon: "text-red-700 dark:text-red-400",
    title: "text-red-800 dark:text-red-300",
    body: "text-red-950 dark:text-red-100",
    placeholder: "text-red-700/60 dark:text-red-400/50",
  },
  green: {
    border: "border-green-300/80 dark:border-green-500/40",
    bg: "bg-green-100 dark:bg-green-950/60",
    headerBorder: "border-green-300/60 dark:border-green-500/30",
    icon: "text-green-700 dark:text-green-400",
    title: "text-green-800 dark:text-green-300",
    body: "text-green-950 dark:text-green-100",
    placeholder: "text-green-700/60 dark:text-green-400/50",
  },
  purple: {
    border: "border-purple-300/80 dark:border-purple-500/40",
    bg: "bg-purple-100 dark:bg-purple-950/60",
    headerBorder: "border-purple-300/60 dark:border-purple-500/30",
    icon: "text-purple-700 dark:text-purple-400",
    title: "text-purple-800 dark:text-purple-300",
    body: "text-purple-950 dark:text-purple-100",
    placeholder: "text-purple-700/60 dark:text-purple-400/50",
  },
  blue: {
    border: "border-blue-300/80 dark:border-blue-500/40",
    bg: "bg-blue-100 dark:bg-blue-950/60",
    headerBorder: "border-blue-300/60 dark:border-blue-500/30",
    icon: "text-blue-700 dark:text-blue-400",
    title: "text-blue-800 dark:text-blue-300",
    body: "text-blue-950 dark:text-blue-100",
    placeholder: "text-blue-700/60 dark:text-blue-400/50",
  },
}

export function isNoteColor(value: unknown): value is NoteColor {
  return typeof value === "string" && (NOTE_COLORS as string[]).includes(value)
}

export function readNoteConfiguration(configuration: unknown): NoteConfiguration {
  if (!configuration || typeof configuration !== "object") {
    return {
      text: "",
      width: NOTE_DEFAULT_WIDTH,
      height: NOTE_DEFAULT_HEIGHT,
      color: NOTE_DEFAULT_COLOR,
    }
  }

  const cfg = configuration as Partial<NoteConfiguration>
  return {
    text: typeof cfg.text === "string" ? cfg.text : "",
    width: typeof cfg.width === "number" && Number.isFinite(cfg.width) ? cfg.width : NOTE_DEFAULT_WIDTH,
    height:
      typeof cfg.height === "number" && Number.isFinite(cfg.height) ? cfg.height : NOTE_DEFAULT_HEIGHT,
    color: isNoteColor(cfg.color) ? cfg.color : NOTE_DEFAULT_COLOR,
  }
}

function NoteFlowNode({ data, selected }: NodeProps) {
  const node = (data as { node?: FlowchartRfNode["data"]["node"] }).node
  const onDelete = (data as { onDelete?: (nodeId: string) => void }).onDelete
  if (!node) return null

  const config = readNoteConfiguration(node.configuration)
  const styles = NOTE_STYLES[config.color]

  return (
    <div
      className="group relative"
      style={{ width: config.width, height: config.height }}
    >
      <NodeDeleteButton onDelete={() => onDelete?.(node.id)} />
      <div
        className={`flex h-full w-full flex-col overflow-hidden rounded-md border shadow-sm ${styles.border} ${styles.bg}`}
      >
        <div
          className={`flex shrink-0 items-center gap-1.5 border-b px-2 py-1 ${styles.headerBorder}`}
        >
          <StickyNote className={`h-3.5 w-3.5 shrink-0 ${styles.icon}`} />
          <span className={`truncate text-xs font-medium ${styles.title}`}>Nota</span>
        </div>
        <div
          className={`min-h-0 w-full flex-1 overflow-auto whitespace-pre-wrap break-words px-2 py-1.5 text-sm ${styles.body}`}
        >
          {config.text || (
            <span className={styles.placeholder}>Doble click para editar…</span>
          )}
        </div>
      </div>
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={80}
        handleClassName="!z-50 !bg-primary"
        lineClassName="!z-50 !bg-primary/60"
      />
    </div>
  )
}

export const noteNode: NodeDefinition<NoteConfiguration> = {
  type: "node:note",
  defaultTitle: "Nota",
  description: "Nota libre, no se conecta al flujo.",
  Icon: StickyNote,
  category: "misc",
  defaultConfiguration: {
    text: "",
    width: NOTE_DEFAULT_WIDTH,
    height: NOTE_DEFAULT_HEIGHT,
    color: NOTE_DEFAULT_COLOR,
  },
  FlowComponent: NoteFlowNode,
  actions: [renameNodeAction],
  outgoingEdges() {
    return []
  },
  handlers: {
    onConnect() {
      return false
    },
    onDelete() {
      return true
    },
  },
}

export function createNoteDomainNode(): INode {
  return {
    id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: noteNode.defaultTitle,
    createdAt: new Date().toISOString(),
    type: noteNode.type,
    configuration: structuredClone(noteNode.defaultConfiguration),
    nextNode: "",
  }
}
