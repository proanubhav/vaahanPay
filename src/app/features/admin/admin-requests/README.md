# Admin challan requests

Open `/admin/challan-requests` or choose **Challan requests** in the sidebar.
The list supports search, resolution-status filtering and pagination. Open a
request to inspect its customer, offence, vehicle and payment details, append
remarks, change resolution status, and upload or replace a receipt.

The existing `ADMIN_USE_DEMO_DATA` token defaults to true. Demo requests contain
only submitted sample challans, with fictional payment information. Changes and
receipt object URLs last for the running app session and reset on reload. Status
and progress remarks are shared with demo user profiles. They are not real
payments or persistent uploads. The user panel currently has no submission or
payment backend; this feature does not implement payment collection.

## Backend contract to implement

With `ADMIN_USE_DEMO_DATA` set to false, the service expects:

- `GET /api/admin/challan-requests`: a `ChallanRequest[]`, newest submissions
  first, with customer, challan, verified payment, remarks and receipt metadata
  as defined in `admin-request.model.ts`. Include submitted requests only;
  payment status is separate from resolution status. This initial implementation
  filters and paginates the returned collection in the client.
- `PATCH /api/admin/challan-requests/:id`: credentialed multipart form data
  containing `status` (`pending`, `in-progress`, `closed`), `remark` (optional
  text, at most 2,000 characters) and optional `receipt` file. Return the entire
  updated `ChallanRequest`. Apply these changes atomically so retrying an upload
  failure does not partially append a remark or change a status.

The server must authorize administrator access for both endpoints, validate
status transitions and input, timestamp remarks and supply their author from the
session, and verify receipt content and size (non-empty PDF/JPEG/PNG, up to 5 MB).
Store receipts durably and return an authorized HTTP(S) or same-origin download
URL. Payment fields must come from verified backend payment records, not from
this admin form. Save resolution updates to the same records used by user
profiles. Closing a request must not fabricate a payment or settlement amount.

Enable the existing admin route guards when deploying authenticated admin APIs;
they are currently commented out in `admin-routing.module.ts`. Server-side
administrator authorization remains required regardless of client routing.
