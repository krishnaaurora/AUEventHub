import { runEventLifecycleAutomation } from '../app/api/_lib/event-lifecycle.js'

async function main() {
  const result = await runEventLifecycleAutomation()
  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error)
  process.exit(1)
})
