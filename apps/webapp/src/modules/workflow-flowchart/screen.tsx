import { ArrowLeft } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { FlowchartComposition } from "./compositions/FlowchartComposition"
import { FlowchartHeaderComposition } from "./compositions/FlowchartHeaderComposition"
import { FlowchartStoreProvider } from "./store"

function FlowchartView({ id }: { id: string }) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-stretch border-b border-border bg-background">
        <div className="flex items-center border-r border-border px-2">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link to="/workflows" aria-label="Volver a workflows" title="Volver">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="min-w-0 flex-1">
          <FlowchartHeaderComposition />
        </div>
      </div>
      <FlowchartComposition workflowId={id} />
    </div>
  )
}

export function FlowchartScreen() {
  const { id = "" } = useParams<{ id: string }>()
  return (
    <FlowchartStoreProvider>
      <FlowchartView id={id} />
    </FlowchartStoreProvider>
  )
}
