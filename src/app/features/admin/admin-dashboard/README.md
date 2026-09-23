# Admin dashboard

`/admin` now opens `/admin/dashboard`. The sidebar and default login destination
also point to the dashboard.

The dashboard uses `AdminService.users('', 1, 1)` for the registered-user total
and `AdminRequestsService.list()` for request analytics. The existing demo flag
applies to both sources; no new backend endpoint is needed. In API mode, the
request-list endpoint must return the complete submitted-request collection, as
documented in `../admin-requests/README.md`.

The selected period filters requests by their UTC submission date, inclusively.
Registered users and the action queue are explicitly all-time counts. Customer
payments sum known `paymentAmount` values only for requests marked `paid` in the
selected submission cohort. They are not revenue, profit or payments received
within the selected date range. Missing paid amounts are disclosed on the card.
Resolution and payment charts describe the current state of that same cohort.

D3 generates the line/area paths, donut arcs, and chart scales; Angular renders
the resulting SVG. Charts have responsive view boxes, data tables and keyboard
accessible status actions. Daily trend buckets include zero-activity dates;
all-time ranges longer than 100 days use monthly buckets.

Dashboard links support these query parameters on `/admin/challan-requests`:

- `requestId`: open a specific request after loading records.
- `status`: pending, in-progress, closed, or open (pending plus in-progress).
- `paymentStatus`: paid, pending, or failed.
- `from`: inclusive UTC submission date in YYYY-MM-DD format.
- `attention=true`: unresolved requests, payment issues, or missing receipts.

Tasks show the six newest actionable submissions. Customer names open user
profiles, and Take action opens the exact request. Returning to the dashboard
loads fresh records, including edits made in the current demo session.

D3 references: https://d3js.org/d3-shape/pie and https://d3js.org/d3-scale/band.
