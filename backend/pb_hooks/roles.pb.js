/// <reference path="../pb_data/types.d.ts" />

// Prevent users from setting their own role on create or update
onRecordCreateRequest((e) => {
  e.record.set("role", "user");
  e.next();
}, "users");

onRecordUpdateRequest((e) => {
  // Only superusers can change roles
  if (!e.hasSuperuserAuth()) {
    e.record.set("role", e.record.original().get("role"));
  }
  e.next();
}, "users");
