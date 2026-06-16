export type OrchestratorLogger = (message: string) => void

export interface AgentContext {
  projectDirectory: string
  log: OrchestratorLogger
}
