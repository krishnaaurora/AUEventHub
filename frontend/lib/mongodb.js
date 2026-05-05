import { MongoClient, ServerApiVersion } from 'mongodb'

const uri = process.env.MONGODB_URI
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Connection timeout settings to handle DNS resolution delays
  connectTimeoutMS: 30000,      // 30s timeout for initial connection (increased from default 10s)
  socketTimeoutMS: 45000,       // 45s socket timeout for operations
  serverSelectionTimeoutMS: 15000, // 15s for server selection
  // DNS settings to handle resolution issues
  family: 4,                     // Force IPv4 to avoid IPv6 DNS issues
  retryWrites: true,            // Enable retry logic for transient failures
}

let client
let clientPromise

if (!uri) {
  console.log('--- [DB INFO] No MONGODB_URI found, using mock database fallback ---')
  clientPromise = null
} else {
  if (!global._mongoClientPromise) {
    console.log('--- [DB INFO] Initializing new MongoClient ---')
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
      .then(m => {
        console.log('--- [DB INFO] MongoDB Connected Successfully ---')
        return m
      })
      .catch(err => {
        console.error('--- [DB ERROR] MongoDB Connection Failed ---', err.message)
        throw err
      })
  }
  clientPromise = global._mongoClientPromise
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise