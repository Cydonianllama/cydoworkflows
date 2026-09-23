import { useEffect, useRef } from "react"
import { useFlowchartActions } from "../actions/useFlowchartActions"
import { useFlowchartStore } from "../store"

export function useFlowchartInitialLoad() {
  const { loadWorkflowAction, loadGraphAction } = useFlowchartActions()
  const { workflowId } = useFlowchartStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (!workflowId) return
    if (initialized.current) return
    initialized.current = true
    void loadWorkflowAction()
    void loadGraphAction()
  }, [workflowId, loadWorkflowAction, loadGraphAction])
}
