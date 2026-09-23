import { describe, expect, it } from "vitest"
import type { Edge, Node } from "@xyflow/react"
import { duplicateNodes } from "../utils/duplicateNodes"
import type { INode, WhatsAppConfiguration } from "../nodes/types"
import { getNodeDefinition } from "../nodes"

function createDomain(overrides: Partial<INode> = {}): INode {
  return {
    id: "node_a",
    title: "Trigger",
    createdAt: "2026-01-01T00:00:00.000Z",
    type: "node:trigger",
    configuration: {},
    nextNode: "",
    ...overrides,
  }
}

function createRfNode(domain: INode, extra?: Partial<Node>): Node {
  return {
    id: domain.id,
    type: domain.type,
    position: { x: 100, y: 100 },
    data: { node: domain },
    ...extra,
  }
}

describe("duplicateNodes", () => {
  it("returns empty when there is nothing to duplicate", () => {
    expect(duplicateNodes([], [])).toEqual({ nodes: [], edges: [] })
  })

  it("creates a copy with a new id and offset position", () => {
    const domain = createDomain()
    const source = createRfNode(domain)

    const result = duplicateNodes([source], [])

    expect(result.nodes).toHaveLength(1)
    const copy = result.nodes[0]
    expect(copy.id).not.toBe("node_a")
    expect(copy.position).toEqual({ x: 140, y: 140 })
    expect(copy.selected).toBe(true)

    const copyDomain = (copy.data as { node: INode }).node
    expect(copyDomain.id).toBe(copy.id)
    expect(copyDomain.id).not.toBe(domain.id)
    expect(copyDomain.nextNode).toBe("")
  })

  it("keeps nextNode pointing to targets outside the selection", () => {
    const domain = createDomain({ nextNode: "node_b" })
    const source = createRfNode(domain)

    const result = duplicateNodes([source], [])

    const copyDomain = (result.nodes[0].data as { node: INode }).node
    expect(copyDomain.nextNode).toBe("node_b")
  })

  it("remaps nextNode when the target is also duplicated", () => {
    const first = createDomain({ id: "node_a", nextNode: "node_b" })
    const second = createDomain({ id: "node_b", title: "Agent", type: "node:agent" })
    const sources = [createRfNode(first), createRfNode(second)]

    const result = duplicateNodes(sources, [])

    expect(result.nodes).toHaveLength(2)
    const copyA = (result.nodes[0].data as { node: INode }).node
    const copyB = (result.nodes[1].data as { node: INode }).node
    expect(copyA.id).not.toBe("node_a")
    expect(copyB.id).not.toBe("node_b")
    expect(copyA.nextNode).toBe(copyB.id)
  })

  it("remaps internal edges between duplicated nodes", () => {
    const first = createDomain({ id: "node_a", nextNode: "node_b" })
    const second = createDomain({ id: "node_b", title: "Agent", type: "node:agent" })
    const sources = [createRfNode(first), createRfNode(second)]
    const allEdges: Edge[] = [
      {
        id: "edge_node_a_node_b_main",
        source: "node_a",
        target: "node_b",
        sourceHandle: "main",
        targetHandle: null,
      },
    ]

    const result = duplicateNodes(sources, allEdges)

    const copyA = (result.nodes[0].data as { node: INode }).node
    const copyB = (result.nodes[1].data as { node: INode }).node

    expect(result.edges).toHaveLength(1)
    const copiedEdge = result.edges[0]
    expect(copiedEdge.source).toBe(copyA.id)
    expect(copiedEdge.target).toBe(copyB.id)
    expect(copiedEdge.id).toBe(`edge_${copyA.id}_${copyB.id}_main`)
  })

  it("does not copy edges whose source is outside the selection", () => {
    const second = createDomain({ id: "node_b", title: "Agent", type: "node:agent" })
    const sources = [createRfNode(second)]
    const allEdges: Edge[] = [
      {
        id: "edge_node_a_node_b_main",
        source: "node_a",
        target: "node_b",
        sourceHandle: "main",
        targetHandle: null,
      },
    ]

    const result = duplicateNodes(sources, allEdges)
    expect(result.edges).toHaveLength(0)
  })

  it("remaps whatsapp button nextNode references via mapReferences", () => {
    const definition = getNodeDefinition("node:whatsapp")
    expect(definition?.mapReferences).toBeTypeOf("function")

    const config: WhatsAppConfiguration = {
      action: "sendMessage",
      properties: [
        { type: "message", value: "hola" },
        {
          type: "buttons",
          value: [
            { id: "btn_1", text: "Sí", nextNode: "node_b" },
            { id: "btn_2", text: "No", nextNode: "" },
          ],
        },
      ],
    }

    const first = createDomain({
      id: "node_wa",
      type: "node:whatsapp",
      title: "WhatsApp",
      configuration: config,
      nextNode: "node_b",
    })
    const second = createDomain({ id: "node_b", title: "Agent", type: "node:agent" })
    const sources = [createRfNode(first), createRfNode(second)]

    const result = duplicateNodes(sources, [])

    const copyWa = (result.nodes[0].data as { node: INode }).node
    const copyB = (result.nodes[1].data as { node: INode }).node
    const copyConfig = copyWa.configuration as WhatsAppConfiguration
    const buttonsProp = copyConfig.properties.find((prop) => prop.type === "buttons")
    const buttons =
      buttonsProp && Array.isArray(buttonsProp.value) ? buttonsProp.value : []

    expect(copyWa.nextNode).toBe(copyB.id)
    expect(buttons[0]?.nextNode).toBe(copyB.id)
    expect(buttons[1]?.nextNode).toBe("")
  })
})
