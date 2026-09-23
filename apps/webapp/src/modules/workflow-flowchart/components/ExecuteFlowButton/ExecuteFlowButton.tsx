import { Loader2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/utils/cn"
import type { ExecuteFlowButtonProps } from "./executeFlowButtonProps"

export type { ExecuteFlowButtonProps, ExecuteFlowTriggerItem } from "./executeFlowButtonProps"

export function ExecuteFlowButton({
  triggers,
  running = false,
  onExecute,
  className,
}: ExecuteFlowButtonProps) {
  if (triggers.length === 0) return null

  const icon = running ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <Play className="h-4 w-4" />
  )

  if (triggers.length === 1) {
    const trigger = triggers[0]
    return (
      <Button
        type="button"
        variant="secondary"
        disabled={running}
        className={cn("bg-background shadow-md", className)}
        onClick={() => onExecute(trigger.id)}
      >
        {icon}
        {running ? "Ejecutando…" : "Ejecutar"}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          disabled={running}
          className={cn("bg-background shadow-md", className)}
        >
          {icon}
          {running ? "Ejecutando…" : "Ejecutar flujo"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-[12rem]">
        {triggers.map((trigger) => (
          <DropdownMenuItem
            key={trigger.id}
            disabled={running}
            onSelect={() => onExecute(trigger.id)}
          >
            <trigger.Icon className="mr-2 h-4 w-4" />
            <span className="truncate">{trigger.title}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
