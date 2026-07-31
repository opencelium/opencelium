# Connector Icon Endpoints

How a connector's icon is uploaded, replaced and deleted.

The icon is part of the connector and is owned by `ConnectorService`
(`storeIcon` / `deleteIcon`). The image file is written to disk by
`UserStorageService` under `./storage/files/`; the connector row stores only the
generated **filename** (e.g. `7c09171b-….png`). On read, the `ConnectorResource`
mapper prepends the `/storage/files/` prefix exactly once via
`StringUtility.resolveImagePath`.

---

## 1. Upload / replace icon

```
POST /connector/{id}/icon        (multipart/form-data, part: file)
```

| Part   | Type | Required | Notes                              |
|--------|------|----------|------------------------------------|
| `file` | file | yes      | Image to store. `jpg`, `jpeg`, `png` only. |

**Behaviour**
- Generates a UUID filename, stores the file, and sets it on the connector.
- If the connector already has an icon, the **previous file is deleted** before
  the new one is stored (no orphaned files on replace).
- Rejects an empty file or an unsupported extension (`StorageException`), and an
  unknown `id` (`ConnectorNotFoundException`).

**Response** `200 OK` — the updated `ConnectorResource` (its `icon` is the full
`/storage/files/<uuid>.<ext>` path).

## 2. Delete icon

```
DELETE /connector/{id}/icon
```

**Behaviour**
- Removes the stored file (if any) and clears the connector's `icon` column.
- Unknown `id` → `ConnectorNotFoundException`.

**Response** `204 No Content`.

---

## Notes

- **Path doubling (fixed):** `ConnectorController.update` (PUT `/connector/{id}`)
  receives the icon as the full `/storage/files/<uuid>.png` URL the client last
  read. The service strips it back to the bare filename with
  `StringUtility.findImageFromUrl` before saving, so the prefix is not prepended
  twice on the next read.
- **Deprecated endpoint:** `POST /storage/connector` (`file` + `connectorId`) on
  `FileController` still works but is `@Deprecated` — it delegates to
  `ConnectorService.storeIcon`. New clients should use `POST /connector/{id}/icon`.
