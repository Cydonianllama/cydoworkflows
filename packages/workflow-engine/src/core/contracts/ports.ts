import type { TriggerRegistration } from "../models"

/**
 * Puertos que el núcleo del engine necesita.
 * El engine NO conoce Mongo ni Express: la API inyecta las implementaciones reales.
 */

export interface ClockPort {
  now(): Date
}

export interface CryptoPort {
  randomToken(bytes: number): string
}

export interface TriggerRegistryPort {
  replaceForWorkflow(workflowId: string, registrations: TriggerRegistration[]): Promise<void>
  removeForWorkflow(workflowId: string): Promise<void>
  listCronTriggers(): Promise<TriggerRegistration[]>
  findByWebhookToken(token: string): Promise<TriggerRegistration | null>
}

export interface EnginePorts {
  registry: TriggerRegistryPort
  crypto: CryptoPort
  clock: ClockPort
}
