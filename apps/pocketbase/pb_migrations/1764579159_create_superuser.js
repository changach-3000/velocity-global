/// <reference path="../pb_data/types.d.ts" />
/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const email = $os.getenv("PB_SUPERUSER_EMAIL")
    const password = $os.getenv("PB_SUPERUSER_PASSWORD")
    
    const superusers = app.findCollectionByNameOrId("_superusers")
    const record = new Record(superusers)
    
    record.set("email", email)
    record.set("password", password)
    
    app.save(record)
})
