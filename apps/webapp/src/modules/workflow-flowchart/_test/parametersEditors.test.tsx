import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { ParametersEditors } from "../components/ParametersEditors/ParametersEditors"
import type { NodeParameterEntry, NodeParameterField } from "../nodes/types"

const fields: NodeParameterField[] = [
  {
    type: "METHOD",
    label: "Method",
    editor: "select",
    required: true,
    options: [
      { value: "GET", label: "GET" },
      { value: "POST", label: "POST" },
    ],
    defaultValue: "POST",
  },
  { type: "URL", label: "URL", editor: "input", required: true, defaultValue: "" },
  { type: "BODY", label: "Body", editor: "textarea", required: true, defaultValue: "" },
  { type: "HEADERS", label: "Headers", editor: "keyvalue", required: false, defaultValue: [] },
]

const baseValues: NodeParameterEntry[] = [
  { type: "METHOD", value: "POST" },
  { type: "URL", value: "" },
  { type: "BODY", value: "" },
]

describe("ParametersEditors", () => {
  it("renderiza los required fields", () => {
    render(<ParametersEditors fields={fields} values={baseValues} onChange={() => {}} />)

    expect(screen.getByLabelText("Method")).toBeInTheDocument()
    expect(screen.getByLabelText("URL")).toBeInTheDocument()
    expect(screen.getByLabelText("Body")).toBeInTheDocument()
    expect(screen.queryByLabelText("Headers")).not.toBeInTheDocument()
  })

  it("emite onChange al editar un input", () => {
    const onChange = vi.fn()
    render(<ParametersEditors fields={fields} values={baseValues} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText("URL"), { target: { value: "https://x" } })

    expect(onChange).toHaveBeenCalledWith([
      { type: "METHOD", value: "POST" },
      { type: "URL", value: "https://x" },
      { type: "BODY", value: "" },
    ])
  })

  it("muestra errores por campo", () => {
    render(
      <ParametersEditors
        fields={fields}
        values={baseValues}
        onChange={() => {}}
        errors={{ URL: "URL requerida" }}
      />,
    )

    expect(screen.getByText("URL requerida")).toBeInTheDocument()
  })

  it("agrega HEADERS desde el select de opcionales", () => {
    const onChange = vi.fn()
    render(<ParametersEditors fields={fields} values={baseValues} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText("Agregar parámetro"), {
      target: { value: "HEADERS" },
    })

    expect(onChange).toHaveBeenCalledWith([
      ...baseValues,
      { type: "HEADERS", value: [] },
    ])
  })

  it("permite quitar un optional presente", () => {
    const onChange = vi.fn()
    const values: NodeParameterEntry[] = [
      ...baseValues,
      { type: "HEADERS", value: [{ key: "a", value: "1" }] },
    ]
    render(<ParametersEditors fields={fields} values={values} onChange={onChange} />)

    expect(screen.getByLabelText("Headers key 1")).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText("Quitar Headers"))

    expect(onChange).toHaveBeenCalledWith(baseValues)
  })

  it("agrega y quita filas dentro de keyvalue", () => {
    const onChange = vi.fn()
    const values: NodeParameterEntry[] = [...baseValues, { type: "HEADERS", value: [] }]
    const { rerender } = render(
      <ParametersEditors fields={fields} values={values} onChange={onChange} />,
    )

    fireEvent.click(screen.getByRole("button", { name: /Agregar fila/ }))
    expect(onChange).toHaveBeenCalledWith([
      ...values,
    ].map((entry) =>
      entry.type === "HEADERS" ? { type: "HEADERS", value: [{ key: "", value: "" }] } : entry,
    ))

    const withRow: NodeParameterEntry[] = [
      ...baseValues,
      { type: "HEADERS", value: [{ key: "X-Token", value: "abc" }] },
    ]
    rerender(<ParametersEditors fields={fields} values={withRow} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText("Quitar fila 1"))

    expect(onChange).toHaveBeenLastCalledWith([
      ...baseValues,
      { type: "HEADERS", value: [] },
    ])
  })

  it("no muestra el select de opcionales cuando no hay opcionales disponibles", () => {
    render(
      <ParametersEditors
        fields={fields.filter((f) => f.required)}
        values={baseValues}
        onChange={() => {}}
      />,
    )

    expect(screen.queryByLabelText("Agregar parámetro")).not.toBeInTheDocument()
  })
})
