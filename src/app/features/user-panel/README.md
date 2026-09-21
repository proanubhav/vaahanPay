# User panel design

Run `npm start`, then open one of the independent routes:

| URL | Component |
| --- | --- |
| `/user-panel` | Redirects to My Vehicles |
| `/user-panel/my-vehicles` | `MyVehiclesComponent` |
| `/user-panel/challans` | `ChallansComponent`, defaults to Pending |
| `/user-panel/challans/pending` | `PendingChallansComponent` |
| `/user-panel/challans/in-progress` | `InProgressChallansComponent` |
| `/user-panel/challans/closed` | `ClosedChallansComponent` |

`UserPanelComponent` owns only the shared account shell (header, navigation,
profile summary, statistics, footer, and router outlet). `ChallansComponent`
owns the vehicle strip, status navigation, and its nested router outlet.
Each screen has its own component, HTML template, and scoped SCSS file.
Small SCSS partials share palette tokens, visual primitives, and empty-state styles.
`UserPanelRoutingModule` owns the feature's route definitions.

The Add Vehicle button on My Vehicles opens the separate `AddVehicleComponent`
popup. Angular Material provides focus trapping, Escape/backdrop dismissal,
Cancel/close controls, and focus restoration. The popup is not a separate page.
Its submission button remains disabled because this is a design-only feature.

All screen content remains static HTML/SCSS. Minimal Angular code handles
navigation and opening/closing the popup. There are no API requests, authentication,
payments, persistence, or vehicle submission logic. Native radio inputs only
filter the pending challan list; details/summary elements expand individual
challans and the missing-challan form. Bulk selection and submission are disabled
placeholders. Sample counts, dates, records, and verification labels are static.
