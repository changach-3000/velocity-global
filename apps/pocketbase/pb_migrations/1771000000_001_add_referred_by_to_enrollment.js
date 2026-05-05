/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("enrollment");

  collection.fields.add(new Field({
    "type": "text",
    "id": "text_referred_by",
    "name": "referred_by",
    "required": false,
    "hidden": false,
    "presentable": false,
    "primaryKey": false,
    "system": false,
    "autogeneratePattern": "",
    "max": 0,
    "min": 0,
    "pattern": ""
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("enrollment");
  const field = collection.fields.getByName("referred_by");
  collection.fields.remove(field);
  return app.save(collection);
});