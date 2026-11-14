# PlateRegion — UI specification (Epic 2)

Living specification of `apps/web` screens and behaviour. UI issues of Epic 2 reference its sections by heading. How plates are parsed is defined by `plate-domain` and `docs/decisions.md`, not here.

## Goals

- Product: type or photograph a Polish plate and see where it is registered. Two audiences: someone who saw a plate on the street, and someone exploring how Polish plates work.
- Learning: NG-ZORRO, Signal Forms, charts, end-to-end testing techniques.
- Phone and desktop are equally important.

## Global

- UI library: NG-ZORRO with the Ant Design theme, adjusted through theme variables and global rules in `src/theme/` for WCAG AA contrast and the header design (D-28 and its Updates). Custom component styling only for the plate component, the plate input and the home Search button (see Components).
- Theme: follows the system setting; a toggle in the top bar overrides it (D-28).
- Languages: Polish and English. Plural forms must be handled: Polish uses the CLDR categories one, few, many and other; English uses one and other.
- Navigation: a light top bar on every page (component background, a 1 px divider below, the Tablicomat logo — a plate with the word "TABLICOMAT" and a location pin — as the brand link to home); below 992 px (tablets and phones) its links collapse into a burger menu; on wider screens the menu is centred in the bar, with the brand at the left edge and the controls at the right edge. The bar holds the theme toggle and the language switch. Page content starts 24 px below the bar.
- No network: every lookup runs on-device against `plate-data` and `plate-domain`. No HTTP APIs in Epic 2; the app requests only its own static assets (fonts, i18n dictionaries).
- No search history: the collection is Epic 5.
- Zoneless: no `NgZone`, no dependency that requires zone.js.

## Pages

### Home — `/`

- Heading: "Decode a Polish plate" / "Rozszyfruj polską tablicę" (D-53 Update #115).
- The heading, the plate input with a square icon Search button beside it and the hint under them, centred horizontally and vertically (D-53 Update #115).
- Photo (Epic 4, #92): a photo button that starts recognition and opens the result page; on phones it is the primary action, placed before Search. Home has no photo control in Epic 2 (D-53 Update #92).
- Search runs on Enter or the Search button, not on every keystroke.
- Every input except an empty one or one with characters not allowed on Polish plates navigates to the result page; those two stay errors under the plate (D-52 Update #115).
- No map on home for now; a map on home is a Backlog follow-up (#148, D-53 Update #146).

### Result — `/plate/:plate`

- The URL holds the plate, so the page can be shared.
- The `h1` names the county with `countyHeading` (seat-based; Warsaw may include a single district; D-54 Names Update #169); the reading's County row keeps the act name.
- Shows: the plate on a car (D-54); the reading — voivodeship, county, district and plate type, or two readings when the characters allow both (D-54); a button that opens the voivodeship map in a dialog (D-54 Update #161, D-61 Update #161); a link to the voivodeship page at the matching code (D-54 Update #141); a card with the voivodeship and its main codes named by `countyHeading` (capitals, then other cities with powiat rights, then land counties; up to 10 lines, D-54 Update #169); and the map of Poland with the voivodeship tinted and clickable, the county ringed, and the 18 capitals marked, labelled "Seat (CODE)" like the county (D-64 Update #161).
- For m.st. Warszawa with a five-character vehicle part, a District row (or Possible districts) follows the powiat; the names come from unofficial data (D-57).
- Image: an SVG car with the plate drawn in its plate area. From Epic 4 (#92), a photo taken or uploaded in this session replaces the car until reload; a shared link always shows the SVG car: photos never leave the device (D-04 Update #92).
- Layout: cards (D-67). The shell caps header and content at 1440 px (D-50 Update #175). From 1200 px two columns, 6:5: a full-width `h1` over both, the map card on the left and the car card with the voivodeship card on the right (D-54 Update #175); the map card keeps its natural height, and from about 1360 px the voivodeship card stretches when the map is taller so resolved and candidates end level; through W_sbs (1269 px) the right column is longer. DOM and tab order at every width: heading → map → car → voivodeship. Without a map card the `h1` still spans the full grid and the car stays in the 5fr left column. Below 1200 px one column of at most 40rem in that same order. In the car card the reading sits beside the car (reading left, car right) once the card is 29.625rem wide, else above it; the car is at most 250 px at every width and centred when stacked. Below 768 px the map keeps its 328 px width at 360 px.
- Map of Poland: at most 650 px wide and centred in its card (D-54 Update #167).
- Covers every `ParseResult` variant, including service and military plates (a heading per series, D-54), unknown codes (`not-in-registry`), ambiguous readings and invalid input.
- A short code or an incomplete plate with candidates (`candidatesFor`) shows them under the car: the answer county as the heading when a county's code equals the whole normalised input, otherwise the voivodeship and a counted list of every county (D-54 Update #115). When there is no answer and exactly one county, the page shows that county as a reading with an incomplete-plate note and no plate type row (D-54 Update #166).

### Voivodeship — `/voivodeship/:slug`

- One page per voivodeship (16); any other slug shows a not-found message with a link home (D-58).
- URL: the slug is the ASCII form of the Polish name (`mazowieckie`, `slaskie`, `warminsko-mazurskie`). Not by letter: some voivodeships have two letters.
- Heading: the voivodeship name, then its letters and the counts of counties and codes.
- Tabs (`nz-tabs`) link all 16 voivodeships; the current one is selected.
- No map on this page yet: the county map opens from the table in a drawer (#150), and a map of Poland is a Backlog follow-up (#147).
- An `nz-table` with one row per county: the county, its codes and an example plate of its first code shown with the plate component; m.st. Warszawa has a row per district group (D-57); the same code always shows the same plate (D-44 Update #93).
- Each code is a link to its result page and an anchor (`#DW`); the result page links to the plate's own code, and the page opens scrolled to the row holding it, highlighted.

### Registry — `/registry`

- `nz-table` over the 689 registry codes.
- Filter by voivodeship, search by powiat name or code, sorting by variant count (D-43).
- Each row shows an example plate with the plate component.

### Charts — `/charts`

- Number of powiat codes per voivodeship.
- Share of two-character and three-character codes.
- Chart data comes from pure functions in `plate-domain` (D-29); choosing the library closes D-29.

### About — `/about`

- About the project and its sources: the act and related regulations, and the attribution required by the map data licence.
- How to read a Polish plate.
- Tech stack.

## Components

- Plate: read-only; renders a plate in the style of a real Polish plate (blue PL strip, plate font). Used on the result page over the SVG car, on the voivodeship page and in the registry table.
- Plate input: the editable variant of the plate component, used on the home page.
- Map: SVG county map of one voivodeship, or of Warsaw with its 18 districts, drawn from bundled geometry (D-60) with no requests beyond the app's own chunks; areas filled per result, a label where the code fits, and a tooltip with the county, its codes and a link to its row (D-61). The map of Poland (D-62) uses the same component without county interaction: faint county lines, the voivodeship outlines, the voivodeship tinted as one button that opens the dialog, the powiat filled and ringed, and "Seat (CODE)" labels with markers for the 18 capitals (D-64 Update #161).

## Testing

- Unit tests (Vitest) and end-to-end tests (Playwright) are acceptance criteria of every UI issue, not separate tasks.
- End-to-end techniques to cover: user journeys (search → result → voivodeship), mobile emulation and several screen sizes, photo upload and camera input (Epic 4), visual regression with screenshots.
- Visual regression baselines are taken and compared in one environment, the Playwright Docker image, both locally and in CI: screenshots differ between operating systems.
