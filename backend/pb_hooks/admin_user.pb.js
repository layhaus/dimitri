/// <reference path="../pb_data/types.d.ts" />

// Auto-create admin user on app boot if it doesn't exist
onBootstrap((e) => {
  const email = $os.getenv("PB_APP_ADMIN_EMAIL")
  const password = $os.getenv("PB_APP_ADMIN_PASSWORD")
  const name = $os.getenv("PB_APP_ADMIN_NAME") || "Admin"

  if (!email || !password) {
    e.next()
    return
  }

  // Check if user already exists
  try {
    const existing = e.app.findAuthRecordByEmail("users", email)
    // Ensure role is admin
    if (existing.get("role") !== "admin") {
      existing.set("role", "admin")
      e.app.save(existing)
    }
  } catch (err) {
    // User doesn't exist, create it
    const users = e.app.findCollectionByNameOrId("users")
    const record = new Record(users)
    record.set("email", email)
    record.set("name", name)
    record.set("verified", true)
    record.set("role", "admin")
    record.setPassword(password)
    e.app.save(record)
  }

  e.next()
})
