# PlateRegion — UI specification (Epic 2)

Living specification of `apps/web` screens and behaviour. UI issues of Epic 2 reference its sections by heading. How plates are parsed is defined by `plate-domain` and `docs/decisions.md`, not here.

## Goals

- Product: type or photograph a Polish plate and see where it is registered. Two audiences: someone who saw a plate on the street, and someone exploring how Polish plates work.
- Learning: NG-ZORRO, Signal Forms, charts, end-to-end testing techniques.
- Phone and desktop are equally important.

## Global

- UI library: NG-ZORRO with the default Ant Design theme. Custom styling only for the plate component and the plate input (see Components).
- Theme: follows the system setting; a toggle in the top bar overrides it (D-28).
- Languages: Polish, English, Russian. Plural forms must be handled: Polish and Russian use the CLDR categories one, few, many and other.
- Navigation: a top bar on every page; on narrow screens its links collapse into a burger menu. The bar holds the theme toggle and the language switch.
- No network: every lookup runs on-device against `plate-data` and `plate-domain`. No HTTP in Epic 2.
- No search history: the collection is Epic 5.
- Zoneless: no `NgZone`, no dependency that requires zone.js.

## Pages

### Home — `/`

- A plate input styled as a Polish plate, and a photo button. On phones the photo button opens the camera directly; elsewhere it opens a file picker.
- Search runs on Enter or the Search button, not on every keystroke.
- A complete plate navigates to the result page.
- An incomplete plate does not navigate: the home page lists the regions it can belong to (`candidatesFor`).

### Result — `/plate/:plate`

- The URL holds the plate, so the page can be shared.
- Shows: voivodeship and powiat, plate type, the powiat highlighted on the map of Poland, and a link to the voivodeship page that opens at the matching powiat.
- Image: the photo, if the user took or uploaded one in this session; otherwise an SVG car with the plate drawn in its plate area. A shared link always shows the SVG car: photos never leave the device.
- Covers every `ParseResult` variant, including service and military plates (`not-in-registry`, D-46), ambiguous readings and invalid input.

### Voivodeship — `/voivodeship/:slug`

- One page per voivodeship (16).
- URL: the slug is the ASCII form of the Polish name (`mazowieckie`, `slaskie`, `warminsko-mazurskie`). Not by letter: some voivodeships have two letters.
- The map of Poland with this voivodeship highlighted; clicking another voivodeship opens its page.
- The list of powiats with their codes and an example plate for each code, shown with the plate component.

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
- Map: SVG map of Poland with voivodeship and powiat boundaries, drawn from bundled geometry (no map tiles, works offline). On the voivodeship page, clicking a voivodeship opens its page; on the result page, the plate's powiat is highlighted (scale and zoom to be decided during implementation).

## Testing

- Unit tests (Vitest) and end-to-end tests (Playwright) are acceptance criteria of every UI issue, not separate tasks.
- End-to-end techniques to cover: user journeys (search → result → voivodeship), mobile emulation and several screen sizes, photo upload and camera input, visual regression with screenshots.
- Visual regression baselines are taken and compared in one environment, the Playwright Docker image, both locally and in CI: screenshots differ between operating systems.
