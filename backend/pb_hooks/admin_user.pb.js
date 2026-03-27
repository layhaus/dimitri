// Admin user is created via entrypoint.sh superuser upsert
// and then promoted via API after deploy.
// PB JSVM hooks for onBootstrap/onServe are unreliable for this use case.
