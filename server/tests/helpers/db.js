import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let server;

export async function startDb() {
  server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri());
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
}

export async function clearDb() {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export async function stopDb() {
  await mongoose.disconnect();
  if (server) await server.stop();
}
