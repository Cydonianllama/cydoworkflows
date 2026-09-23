# Coding Style

- Type/DTO/request files keep a `.tsx` extension even without JSX (e.g. `responseType.tsx`, `responsePagination.tsx`, `apinameDTO.tsx`, `request1.tsx`). Confidence: 0.75
- DTOs follow per-use-case HTTP verb shapes: POST/PUT responses return an `item`, DELETE returns an `id`, and list endpoints return `items: Array<modelDTO>`. Confidence: 0.8
- Every API response is wrapped in `ResponseApi<T> { status, data, message?, pagination? }` as the default data envelope. Confidence: 0.85
- Pagination is expressed as `ResponsePagination { page, limit, total, totalPages, hasNextPage, hasPreviousPage }`. Confidence: 0.85
- Endpoint functions return `Promise<ResponseApi<T> | null>`, wrap calls in try/catch, and on `axios.isAxiosError(ex)` return `ex.response?.data ?? null` (otherwise `null`). Confidence: 0.85
- Actions hooks defensively validate responses (`if (!req)`, `if (!req.status)`, `if (!req.data.x)`) showing a `toast.error` for each case, and reset loading state in `finally`. Confidence: 0.8
- Larger components live in a folder named after them containing `componentName.tsx`, `componentNameProps.tsx`, and optionally `componentName.css`; small components are just a single named file. Confidence: 0.8
- The module's `screen.tsx` assembles the module's main view; multiple views go in a `screens/` folder. Confidence: 0.7
- `utils/` holds cross-module utilities: time/date helpers, text formatting, text sanitization, and regex validations. Confidence: 0.7
- Error messages in actions/toasts reference the failing action in parentheses, e.g. `"Error inesperado (ListChatsAction)"`. Confidence: 0.65
