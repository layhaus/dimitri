package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/hook"
)

func main() {
	app := pocketbase.New()

	registerMigrations()
	registerHooks(app)

	// Static file serving (SPA with index fallback)
	publicDir := envOr("PB_PUBLIC_DIR", defaultPublicDir())
	app.OnServe().Bind(&hook.Handler[*core.ServeEvent]{
		Func: func(e *core.ServeEvent) error {
			if !e.Router.HasRoute(http.MethodGet, "/{path...}") {
				e.Router.GET("/{path...}", apis.Static(os.DirFS(publicDir), true))
			}
			return e.Next()
		},
		Priority: 999,
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}

// --- Migrations ---

func registerMigrations() {
	core.AppMigrations.Register(
		func(txApp core.App) error {
			// 1. Update users collection: add role field
			users, err := txApp.FindCollectionByNameOrId("users")
			if err != nil {
				users = core.NewAuthCollection("users")
			}

			ruleAuthd := `@request.auth.id != ""`
			ruleSelfOnly := "id = @request.auth.id"
			users.ListRule = &ruleAuthd
			users.ViewRule = &ruleAuthd
			rulePublic := ""
			users.CreateRule = &rulePublic
			users.UpdateRule = &ruleSelfOnly

			users.Fields.Add(&core.SelectField{
				Name:      "role",
				Values:    []string{"user", "admin"},
				MaxSelect: 1,
			})

			if err := txApp.Save(users); err != nil {
				return err
			}

			// 2. Create inquiries collection
			inquiries := core.NewBaseCollection("inquiries")

			listViewRule := `@request.auth.id = user || @request.auth.role = "admin"`
			createRule := `@request.auth.id != ""`
			updateRule := `@request.auth.role = "admin"`
			deleteRule := `@request.auth.id = user || @request.auth.role = "admin"`

			inquiries.ListRule = &listViewRule
			inquiries.ViewRule = &listViewRule
			inquiries.CreateRule = &createRule
			inquiries.UpdateRule = &updateRule
			inquiries.DeleteRule = &deleteRule

			inquiries.Fields.Add(
				&core.FileField{
					Name:      "file",
					Required:  true,
					MaxSelect: 1,
					MaxSize:   52428800, // 50 MB
				},
				&core.TextField{
					Name:     "filename",
					Required: true,
					Max:      500,
				},
				&core.RelationField{
					Name:         "user",
					Required:     true,
					CollectionId: users.Id,
					MaxSelect:    1,
				},
				&core.SelectField{
					Name:      "status",
					Values:    []string{"pending", "in_review", "reviewed", "rejected"},
					MaxSelect: 1,
				},
				&core.TextField{
					Name: "notes",
					Max:  5000,
				},
				&core.AutodateField{
					Name:     "created",
					OnCreate: true,
				},
				&core.AutodateField{
					Name:     "updated",
					OnCreate: true,
					OnUpdate: true,
				},
			)

			inquiries.Indexes = []string{
				"CREATE INDEX idx_inquiries_user ON inquiries (user)",
				"CREATE INDEX idx_inquiries_status ON inquiries (status)",
				"CREATE INDEX idx_inquiries_created ON inquiries (created)",
			}

			return txApp.Save(inquiries)
		},
		func(txApp core.App) error {
			col, err := txApp.FindCollectionByNameOrId("inquiries")
			if err == nil {
				return txApp.Delete(col)
			}
			return nil
		},
		"001_init.go",
	)
}

// --- Hooks ---

func registerHooks(app *pocketbase.PocketBase) {
	// Auto-create admin user on serve
	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		ensureAdminUser(e.App)
		return e.Next()
	})

	// Force role to "user" on registration (prevent self-promotion)
	app.OnRecordCreateRequest("users").BindFunc(func(e *core.RecordRequestEvent) error {
		e.Record.Set("role", "user")
		return e.Next()
	})

	// Prevent non-superusers from changing role
	app.OnRecordUpdateRequest("users").BindFunc(func(e *core.RecordRequestEvent) error {
		if !e.HasSuperuserAuth() {
			original := e.Record.Original()
			if original != nil {
				e.Record.Set("role", original.GetString("role"))
			}
		}
		return e.Next()
	})
}

func ensureAdminUser(app core.App) {
	email := os.Getenv("PB_APP_ADMIN_EMAIL")
	password := os.Getenv("PB_APP_ADMIN_PASSWORD")
	name := os.Getenv("PB_APP_ADMIN_NAME")
	if email == "" || password == "" {
		return
	}

	// Upsert superuser
	superusersCol, err := app.FindCachedCollectionByNameOrId(core.CollectionNameSuperusers)
	if err != nil {
		log.Printf("Warning: could not find superusers collection: %v", err)
		return
	}

	su, err := app.FindAuthRecordByEmail(superusersCol, email)
	if err != nil {
		su = core.NewRecord(superusersCol)
		su.SetEmail(email)
	}
	su.SetPassword(password)
	if err := app.Save(su); err != nil {
		log.Printf("Warning: could not upsert superuser: %v", err)
	}

	// Upsert app admin user
	usersCol, err := app.FindCachedCollectionByNameOrId("users")
	if err != nil {
		log.Printf("Warning: could not find users collection: %v", err)
		return
	}

	user, err := app.FindAuthRecordByEmail(usersCol, email)
	if err != nil {
		user = core.NewRecord(usersCol)
		user.SetEmail(email)
		user.Set("name", name)
		user.SetVerified(true)
		user.SetPassword(password)
	}
	user.Set("role", "admin")
	if err := app.Save(user); err != nil {
		log.Printf("Warning: could not upsert admin user: %v", err)
	}

	log.Printf("Admin user ensured: %s", email)
}

// --- Helpers ---

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func defaultPublicDir() string {
	exe, err := os.Executable()
	if err != nil {
		return "./pb_public"
	}
	return filepath.Join(filepath.Dir(exe), "pb_public")
}
