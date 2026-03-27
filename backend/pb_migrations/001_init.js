/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // ── Update users auth collection: add role field ──
  let users;
  try {
    users = app.findCollectionByNameOrId("users");
  } catch (e) {
    users = new Collection({ name: "users", type: "auth" });
  }

  users.listRule = '@request.auth.id != ""';
  users.viewRule = '@request.auth.id != ""';
  users.createRule = "";
  users.updateRule = "id = @request.auth.id";
  users.deleteRule = null;

  // Add role field (find existing or append)
  const existingFields = users.fields || [];
  const hasRole = existingFields.some(f => f.name === "role");
  if (!hasRole) {
    existingFields.push({
      name: "role",
      type: "select",
      values: ["user", "admin"],
      maxSelect: 1,
      required: false,
    });
    users.fields = existingFields;
  }

  app.save(users);

  // ── Create inquiries collection ──
  const inquiries = new Collection({
    name: "inquiries",
    type: "base",
    listRule: '@request.auth.id = user || @request.auth.role = "admin"',
    viewRule: '@request.auth.id = user || @request.auth.role = "admin"',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.id = user || @request.auth.role = "admin"',
    fields: [
      {
        name: "file",
        type: "file",
        required: true,
        maxSelect: 1,
        maxSize: 52428800,
      },
      {
        name: "filename",
        type: "text",
        required: true,
        max: 500,
      },
      {
        name: "user",
        type: "relation",
        required: true,
        collectionId: "_pb_users_auth_",
        maxSelect: 1,
        cascadeDelete: false,
      },
      {
        name: "status",
        type: "select",
        values: ["pending", "in_review", "reviewed", "rejected"],
        maxSelect: 1,
      },
      {
        name: "notes",
        type: "text",
        max: 5000,
      },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: [
      'CREATE INDEX `idx_inquiries_user` ON `inquiries` (`user`)',
      'CREATE INDEX `idx_inquiries_status` ON `inquiries` (`status`)',
      'CREATE INDEX `idx_inquiries_created` ON `inquiries` (`created`)',
    ],
  });
  app.save(inquiries);
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId("inquiries");
    app.delete(col);
  } catch (e) {}
});
