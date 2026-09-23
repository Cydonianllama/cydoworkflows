import { HomeComposition } from "./compositions/HomeComposition"
import { HomeStoreProvider } from "./store"

/** Vista principal del módulo home. */
export function HomeScreen() {
  return (
    <HomeStoreProvider>
      <HomeComposition />
    </HomeStoreProvider>
  )
}
