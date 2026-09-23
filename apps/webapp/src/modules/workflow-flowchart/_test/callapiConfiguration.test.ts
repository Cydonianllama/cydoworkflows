import { describe, expect, it } from "vitest"
import { callApiNode, readCallApiConfiguration } from "../nodes/callapi/callapiNode"

describe("readCallApiConfiguration", () => {
  it("devuelve defaults cuando configuration es null/undefined", () => {
    expect(readCallApiConfiguration(null)).toEqual({
      parameters: [
        { type: "METHOD", value: "POST" },
        { type: "URL", value: "" },
        { type: "BODY", value: "" },
      ],
    })
    expect(readCallApiConfiguration(undefined).parameters).toHaveLength(3)
  })

  it("devuelve defaults con shape legacy (sin parameters)", () => {
    const legacy = { uri: "https://x", method: "GET", headers: [], body: "{}" }
    const result = readCallApiConfiguration(legacy)
    expect(result.parameters.find((p) => p.type === "METHOD")?.value).toBe("POST")
    expect(result.parameters.find((p) => p.type === "URL")?.value).toBe("")
  })

  it("acepta el shape nuevo con parameters", () => {
    const config = {
      parameters: [
        { type: "METHOD", value: "GET" },
        { type: "URL", value: "https://api.test" },
        { type: "BODY", value: "" },
      ],
    }
    const result = readCallApiConfiguration(config)
    expect(result.parameters.find((p) => p.type === "METHOD")?.value).toBe("GET")
    expect(result.parameters.find((p) => p.type === "URL")?.value).toBe("https://api.test")
  })

  it("completa required faltantes con defaults", () => {
    const result = readCallApiConfiguration({ parameters: [{ type: "URL", value: "https://x" }] })
    expect(result.parameters.some((p) => p.type === "METHOD")).toBe(true)
    expect(result.parameters.some((p) => p.type === "BODY")).toBe(true)
    expect(result.parameters.find((p) => p.type === "URL")?.value).toBe("https://x")
  })

  it("descarta entradas inválidas", () => {
    const result = readCallApiConfiguration({
      parameters: [null, { type: "URL", value: "https://ok" }, "junk", {}],
    })
    expect(result.parameters).toEqual(
      expect.arrayContaining([
        { type: "URL", value: "https://ok" },
        expect.objectContaining({ type: "METHOD" }),
        expect.objectContaining({ type: "BODY" }),
      ]),
    )
  })
})

describe("callApiNode.validate", () => {
  it("devuelve errores con URL y METHOD vacíos", () => {
    const errors = callApiNode.validate!({
      parameters: [
        { type: "METHOD", value: "" },
        { type: "URL", value: "   " },
        { type: "BODY", value: "" },
      ],
    })
    expect(errors.METHOD).toBe("Method requerido")
    expect(errors.URL).toBe("URL requerida")
  })

  it("devuelve vacío con config válida", () => {
    const errors = callApiNode.validate!({
      parameters: [
        { type: "METHOD", value: "POST" },
        { type: "URL", value: "https://api.test" },
        { type: "BODY", value: "{}" },
      ],
    })
    expect(errors).toEqual({})
  })

  it("rechaza METHOD fuera del catálogo", () => {
    const errors = callApiNode.validate!({
      parameters: [
        { type: "METHOD", value: "PATCH" },
        { type: "URL", value: "https://api.test" },
      ],
    })
    expect(errors.METHOD).toBe("Method requerido")
  })

  it("no revienta con config legacy o vacía", () => {
    expect(() => callApiNode.validate!({} as never)).not.toThrow()
    expect(() =>
      callApiNode.validate!({ uri: "https://x", method: "GET", headers: [], body: "" } as never),
    ).not.toThrow()
    expect(() => callApiNode.validate!(null as never)).not.toThrow()
    expect(() => callApiNode.validate!(undefined as never)).not.toThrow()

    const errors = callApiNode.validate!({} as never)
    expect(errors.URL).toBe("URL requerida")
    expect(errors.METHOD).toBeUndefined()
  })
})

describe("callApiNode.parameters", () => {
  it("declara required METHOD/URL/BODY y optional HEADERS", () => {
    const fields = callApiNode.parameters ?? []
    const required = fields.filter((f) => f.required).map((f) => f.type)
    const optional = fields.filter((f) => !f.required).map((f) => f.type)

    expect(required).toEqual(["METHOD", "URL", "BODY"])
    expect(optional).toEqual(["HEADERS"])
  })

  it("HEADERS usa editor keyvalue con defaultValue []", () => {
    const headers = callApiNode.parameters?.find((f) => f.type === "HEADERS")
    expect(headers?.editor).toBe("keyvalue")
    expect(headers?.defaultValue).toEqual([])
  })

  it("METHOD es select con GET/POST/PUT/DELETE", () => {
    const method = callApiNode.parameters?.find((f) => f.type === "METHOD")
    expect(method?.editor).toBe("select")
    expect(method?.options?.map((o) => o.value)).toEqual(["GET", "POST", "PUT", "DELETE"])
  })
})
