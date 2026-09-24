import type { CronTriggerRegistration, WorkflowTriggerEngine } from "@cydo/workflow-engine/server"
import { nextCronRun } from "@cydo/workflow-engine/server"

export type CronFireHandler = (registration: CronTriggerRegistration) => Promise<void> | void

export interface CronSchedulerOptions {
  tickMs: number
}

/**
 * Loop de tick para disparar triggers `cron` registrados.
 * El handler (ejecución real del workflow) lo define la API en runtime.
 */
export class CronSchedulerAdapter {
  private timer: NodeJS.Timeout | null = null
  private handler: CronFireHandler | null = null
  private lastTickAt: Date | null = null
  private ticking = false

  constructor(
    private readonly engine: WorkflowTriggerEngine,
    private readonly options: CronSchedulerOptions,
  ) {}

  setHandler(handler: CronFireHandler): void {
    this.handler = handler
  }

  start(): void {
    if (this.timer) return
    this.lastTickAt = null
    this.timer = setInterval(() => {
      void this.tick()
    }, this.options.tickMs)
    this.timer.unref()
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  async tick(now: Date = new Date()): Promise<void> {
    if (this.ticking) return
    this.ticking = true
    try {
      const from = this.lastTickAt
      this.lastTickAt = now
      // Primer tick: sólo establece la línea base (no recupera corridas perdidas).
      if (!from || !this.handler) return

      const triggers = await this.engine.listCronTriggers()
      for (const trigger of triggers) {
        const next = nextCronRun(trigger.cron, trigger.timezone, from)
        if (next && next.getTime() <= now.getTime()) {
          try {
            await this.handler(trigger)
          } catch (error) {
            console.error("[api] falló la ejecución de un trigger cron", error)
          }
        }
      }
    } finally {
      this.ticking = false
    }
  }
}
