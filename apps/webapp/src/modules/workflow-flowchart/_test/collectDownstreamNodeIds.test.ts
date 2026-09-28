import { describe, expect, it } from "vitest"
import type { Edge } from "@xyflow/react"
import { collectDownstreamNodeIds } from "../utils/collectDownstreamNodeIds"

function edge(source: string, target: string): Edge {
  return { id: `${source}-${target}`, source, target }
}

describe("collectDownstreamNodeIds", () => {
  it("devuelve solo el nodo cuando no tiene salidas", () => {
    expect(collectDownstreamNodeIds("a", [])).toEqual(["a"])
  })

  it("incluye el nodo y toda su descendencia", () => {
    const edges = [edge("a", "b"), edge("b", "c"), edge("c", "d")]
    expect(new Set(collectDownstreamNodeIds("b", edges))).toEqual(new Set(["b", "c", "d"]))
  })

  it("soporta bifurcaciones", () => {
    const edges = [edge("a", "b"), edge("a", "c")]
    expect(new Set(collectDownstreamNodeIds("a", edges))).toEqual(new Set(["a", "b", "c"]))
  })

  it("no entra en ciclos", () => {
    const edges = [edge("a", "b"), edge("b", "a")]
    expect(new Set(collectDownstreamNodeIds("a", edges))).toEqual(new Set(["a", "b"]))
  })

  it("no arrastra nodos ajenos", () => {
    const edges = [edge("x", "y"), edge("a", "b")]
    expect(new Set(collectDownstreamNodeIds("a", edges))).toEqual(new Set(["a", "b"]))
  })
})
