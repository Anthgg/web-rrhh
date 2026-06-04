# Backend contract: worker profile and contracts flow

## Problem

The frontend received values like `PENDIENTE-87416` in fields used as `workerId`.
That value is a placeholder/document value, not a PostgreSQL UUID. When the UI called:

```text
/api/workers/PENDIENTE-87416/contracts
```

the backend forwarded it to contract queries and PostgreSQL failed with:

```text
invalid input syntax for type uuid: "PENDIENTE-87416"
```

## Required backend behavior

1. Never expose `PENDIENTE-*`, DNI, `personal_id`, or document numbers as `worker_id`, `workerId`, `id`, or `uuid`.
2. Use a real UUID for every persisted worker row:
   - `worker_id` / `workerId`: UUID from `workers.id`.
   - `user_id` / `userId`: UUID from `users.id` when the record is linked to a user.
   - `personal_id`, `dni`, or `document_number`: visible document value only.
3. If a user exists but the worker row does not, return:

```json
{
  "user_id": "uuid",
  "worker_id": null,
  "document_number": "PENDIENTE-87416",
  "missing_fields": ["laborData.companyId", "laborData.areaId"]
}
```

4. `PUT /api/workers/complete-profile/:userId` must create or update the worker row and return the real worker UUID:

```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "worker_id": "uuid",
    "worker": {
      "id": "uuid",
      "personal_id": "12345678"
    }
  }
}
```

5. Contract endpoints must validate `workerId` before querying PostgreSQL:
   - If `workerId` is not UUID, return `400`.
   - Do not let invalid IDs reach SQL casts.

## Frontend flow expected after backend fix

1. Worker list receives records with separate `id`/`worker_id`, `user_id`, and `document_number`.
2. If `worker_id` is UUID, UI enables profile and contracts.
3. If `worker_id` is missing but `user_id` exists, UI sends the user to `trabajadores/alta?mode=complete&userId={user_id}`.
4. Completing profile returns `worker_id`.
5. UI redirects to `/trabajadores/{worker_id}` and contract generation/listing uses that UUID.
