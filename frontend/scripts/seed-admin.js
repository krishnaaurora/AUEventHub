import { ensureAuthCollections, getUsersCollection } from '../app/api/_lib/db.js'

async function main() {
  await ensureAuthCollections()
  const usersCollection = await getUsersCollection()
  const admin = await usersCollection.findOne({ email: 'admin@aurora.edu.in' })

  console.log(
    JSON.stringify(
      {
        ok: Boolean(admin),
        admin: admin
          ? {
              email: admin.email,
              role: admin.role,
              fullName: admin.fullName,
              registrationId: admin.registrationId,
            }
          : null,
      },
      null,
      2,
    ),
  )

  process.exit(0)
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error)
  process.exit(1)
})
