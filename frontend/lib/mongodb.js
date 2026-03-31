import { MongoClient, ServerApiVersion } from 'mongodb'

const uri = process.env.MONGODB_URI
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
}

let client
let clientPromise

if (!uri) {
  // Allow UI build/deploy even when database env vars are not configured.
  clientPromise = null
} else {
  // In both dev and prod, use a global variable to preserve the connection
  // across module reloads and hot updates. This is crucial for performance.
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise