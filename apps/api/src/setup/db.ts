import mongoose from "mongoose"
import { env } from "./env"

export async function connectDb(uri: string = env.MONGO_URI): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true)

  mongoose.connection.on("connected", () => {
    console.log(`[db] conectado a MongoDB (${mongoose.connection.name})`)
  })
  mongoose.connection.on("error", (error) => {
    console.error("[db] error de conexión", error)
  })

  return mongoose.connect(uri, env.MONGO_DB_NAME ? { dbName: env.MONGO_DB_NAME } : {})
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect()
}
