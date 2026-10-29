# Polish plate rules — source table

Every rule that `libs/plate-domain` relies on, with its source in the act. Decision: D-33.

**Acts.** "1709" = Rozporządzenie Ministra Infrastruktury z dnia 8 listopada 2024 r. w sprawie rejestracji i oznaczania pojazdów, wymagań dla tablic rejestracyjnych oraz wzorów innych dokumentów związanych z rejestracją pojazdów (Dz.U. 2024 poz. 1709); "939" = Dz.U. 2025 poz. 939; "891" = Dz.U. 2026 poz. 891. No consolidated text exists (D-26); where an amendment changes a provision, the amending text is quoted.

**Amendment check.** 939 changes § 27 ust. 5 (§ 1 pkt 1), § 31 ust. 3 (§ 1 pkt 2), § 32 ust. 2 (§ 1 pkt 3) and Annex 13 (§ 1 pkt 4). 891 changes §§ 2, 6, 7, 18, 19, 20, 21, 22 and Annex 13 (§ 1 pkt 9). Neither touches § 25, § 26, § 27 ust. 2–4 and 6–10, § 28, § 30, § 31 ust. 1–2, § 32 ust. 1 and 3, or Annex 12.

**Conventions.** Row IDs are stable: never renumbered or reused (D-33). Code and specs cite the row ID next to the provision, e.g. `§ 31 ust. 1 (R-36)`. Quotes are under "Quotes", one line per row, so a changed quote changes one line; words hyphenated across line breaks in the published text are joined. "Visible" says whether the rule can be seen in the typed characters: yes / no: colour / no: size / no: other. Code paths are relative to `libs/plate-domain/src/lib/pl/` unless stated.

## Rules

| ID   | Rule                                                                                                                                          | Provision                                                     | Amended by                               | Visible                                                                                                                      | Code                                                      |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| R-01 | The act defines exactly five plate types: ordinary, individual, vintage, temporary and diplomatic.                                            | 1709 § 25 pkt 1–5                                             | —                                        | no: other (derived through R-24…R-33)                                                                                        | `plate-type.ts`                                           |
| R-02 | Car plates come in one-row and two-row versions and are used for every vehicle except motorcycles, tractors, mopeds and L6e/L7e.              | 1709 § 26 ust. 1 pkt 1 lit. a                                 | —                                        | no: size                                                                                                                     | —                                                         |
| R-03 | Reduced one-row car plates are for vehicles with a reduced plate space, with listed exclusions.                                               | 1709 § 26 ust. 1 pkt 1 lit. b                                 | —                                        | no: size                                                                                                                     | —                                                         |
| R-04 | Motorcycle plates (two-row) are for motorcycles, tractors and L6e/L7e; moped plates (two-row) are for mopeds.                                 | 1709 § 26 ust. 1 pkt 2–3                                      | —                                        | no: size                                                                                                                     | —                                                         |
| R-05 | Tractors, tourist-train vehicles and some L6e/L7e may carry car plates, so plate size does not identify the vehicle kind.                     | 1709 § 26 ust. 2–4                                            | —                                        | no: size                                                                                                                     | —                                                         |
| R-06 | An ordinary car or motorcycle number consists of voivodeship, powiat and vehicle distinguishers.                                              | 1709 § 27 ust. 2                                              | —                                        | yes                                                                                                                          | `readings.ts`                                             |
| R-07 | Ordinary car and motorcycle plates are black on white, or black on green for electric and hydrogen vehicles.                                  | 1709 § 27 ust. 2 pkt 1–2                                      | —                                        | no: colour                                                                                                                   | —                                                         |
| R-08 | An ordinary reduced number consists of voivodeship and vehicle distinguishers, with no powiat.                                                | 1709 § 27 ust. 3                                              | —                                        | yes                                                                                                                          | `readings.ts`                                             |
| R-09 | Ordinary reduced plates use the colours of R-07.                                                                                              | 1709 § 27 ust. 3 pkt 1–2                                      | —                                        | no: colour                                                                                                                   | —                                                         |
| R-10 | An individual number consists of a voivodeship distinguisher and an individual vehicle distinguisher.                                         | 1709 § 27 ust. 4                                              | —                                        | yes                                                                                                                          | `readings.ts`                                             |
| R-11 | Individual plates are black on white, or black on green for electric and hydrogen vehicles.                                                   | 1709 § 27 ust. 4 pkt 1–2                                      | —                                        | no: colour                                                                                                                   | —                                                         |
| R-12 | A moped number consists of voivodeship, powiat and vehicle distinguishers.                                                                    | 1709 § 27 ust. 5                                              | 939 § 1 pkt 1                            | yes                                                                                                                          | `readings.ts`                                             |
| R-13 | Moped plates are black on white, or black on green for mopeds with an electric motor.                                                         | 1709 § 27 ust. 5 pkt 1–2                                      | —                                        | no: colour                                                                                                                   | —                                                         |
| R-14 | A vintage number consists of voivodeship, powiat and vehicle distinguishers.                                                                  | 1709 § 27 ust. 6                                              | —                                        | yes                                                                                                                          | `readings.ts`                                             |
| R-15 | Vintage plates are black on yellow and carry a vintage symbol.                                                                                | 1709 § 27 ust. 6                                              | —                                        | no: colour                                                                                                                   | —                                                         |
| R-16 | Vintage reduced plates are black on yellow with a laser symbol; the paragraph states no composition.                                          | 1709 § 27 ust. 7                                              | —                                        | no: colour                                                                                                                   | —                                                         |
| R-17 | Vintage moped plates are black on yellow with a laser symbol; the paragraph states no composition.                                            | 1709 § 27 ust. 8                                              | —                                        | no: colour                                                                                                                   | —                                                         |
| R-18 | A temporary number consists of voivodeship and vehicle distinguishers.                                                                        | 1709 § 27 ust. 9                                              | —                                        | yes                                                                                                                          | `readings.ts`                                             |
| R-19 | Temporary plates are red on white, or red on yellow for passenger cars used in motor sport.                                                   | 1709 § 27 ust. 9 pkt 1–2                                      | —                                        | no: colour                                                                                                                   | —                                                         |
| R-20 | A diplomatic number consists of voivodeship and vehicle distinguishers, with no powiat.                                                       | 1709 § 27 ust. 10                                             | —                                        | yes                                                                                                                          | `readings.ts`                                             |
| R-21 | Diplomatic plates are white on blue.                                                                                                          | 1709 § 27 ust. 10                                             | —                                        | no: colour                                                                                                                   | —                                                         |
| R-22 | Diplomatic plates have no EU symbol and no "PL" band.                                                                                         | 1709 § 28 ust. 1 zd. 2                                        | —                                        | no: other                                                                                                                    | —                                                         |
| R-23 | Numbers use 25 letters (no Q) and the digits 0–9.                                                                                             | 1709 § 30 ust. 1                                              | —                                        | yes                                                                                                                          | `alphabet.ts`, `normalise-plate-input.ts`                 |
| R-24 | On ordinary car plates, letter 1 is the voivodeship and letter 2 or letters 2–3 the powiat.                                                   | 1709 § 30 ust. 2 pkt 1 lit. a                                 | —                                        | yes                                                                                                                          | `vehicle-part-templates.ts`                               |
| R-25 | On ordinary car plates with a two-letter powiat, nine layouts are allowed.                                                                    | 1709 § 30 ust. 2 pkt 1 lit. b                                 | —                                        | yes                                                                                                                          | `vehicle-part-templates.ts`                               |
| R-26 | Reduced plates of three types (ordinary, temporary, vintage) use one voivodeship letter followed by seven layouts, whatever the powiat.       | 1709 § 30 ust. 2 pkt 2                                        | —                                        | yes (characters); the type is not visible: colour (R-35)                                                                     | `vehicle-part-templates.ts`                               |
| R-27 | On ordinary motorcycle and moped plates with a one-letter powiat, eight layouts are allowed.                                                  | 1709 § 30 ust. 2 pkt 3 lit. a                                 | —                                        | yes                                                                                                                          | `vehicle-part-templates.ts`                               |
| R-28 | On ordinary motorcycle and moped plates with a two-letter powiat, eight layouts are allowed.                                                  | 1709 § 30 ust. 2 pkt 3 lit. b                                 | —                                        | yes                                                                                                                          | `vehicle-part-templates.ts`                               |
| R-29 | Individual plates use a letter and a digit for the voivodeship, then 3–5 letters, of which at most the last two may be digits.                | 1709 § 30 ust. 2 pkt 4                                        | —                                        | yes                                                                                                                          | `vehicle-part-templates.ts`                               |
| R-30 | On non-reduced vintage plates with a one-letter powiat, two layouts are allowed.                                                              | 1709 § 30 ust. 2 pkt 5 lit. a                                 | —                                        | yes                                                                                                                          | `vehicle-part-templates.ts`                               |
| R-31 | On non-reduced vintage plates with a two-letter powiat, three layouts are allowed.                                                            | 1709 § 30 ust. 2 pkt 5 lit. b                                 | —                                        | yes                                                                                                                          | `vehicle-part-templates.ts`                               |
| R-32 | Temporary plates use a letter and a digit for the voivodeship, then four digits, or three digits and a letter once the four digits run out.   | 1709 § 30 ust. 2 pkt 6                                        | —                                        | yes                                                                                                                          | `vehicle-part-templates.ts`                               |
| R-33 | Diplomatic plates use one voivodeship letter, then six digits.                                                                                | 1709 § 30 ust. 2 pkt 7                                        | —                                        | yes                                                                                                                          | `vehicle-part-templates.ts`                               |
| R-34 | Every digit group in pkt 1, 2, 3, 5, 6 and 7 has a range starting at 0…01, so an all-zero group is never issued.                              | 1709 § 30 ust. 2 pkt 1 lit. a tiret 1; pkt 7 (representative) | —                                        | yes                                                                                                                          | `vehicle-part-templates.ts`                               |
| R-35 | A vehicle with a reduced plate space may get temporary reduced plates and ordinary reduced plates with the same number.                       | 1709 § 30 ust. 3                                              | —                                        | no: colour                                                                                                                   | —                                                         |
| R-36 | The vehicle distinguisher excludes the letters B, D, I, O and Z, except on individual plates (the reservation for § 32 ust. 2).               | 1709 § 31 ust. 1                                              | —                                        | yes                                                                                                                          | `vehicle-part-templates.ts`                               |
| R-37 | Voivodeship and powiat distinguishers are those listed in Annex 13.                                                                           | 1709 § 31 ust. 2                                              | Annex 13: 939 § 1 pkt 4, 891 § 1 pkt 9   | yes                                                                                                                          | plate-data `registry.ts`; `readings.ts`; `parse-plate.ts` |
| R-38 | An individual plate is issued only if no identical plate was issued to another vehicle registered in the voivodeship.                         | 1709 § 32 ust. 1                                              | —                                        | no: other                                                                                                                    | —                                                         |
| R-39 | The owner chooses the individual distinguisher and, where Annex 13 gives the voivodeship two letters, may choose which of the two is used.    | 1709 § 32 ust. 2                                              | 939 § 1 pkt 3 (new wording of ust. 2)    | yes                                                                                                                          | `vehicle-part-templates.ts`                               |
| R-40 | Annex 12 separates type ("rodzaj", the five types) from variant ("odmiana", one-row or two-row); a pattern ("wzór") is a type plus a variant. | 1709 Annex 12 pkt 1.1 pkt 1–3                                 | —                                        | no: size                                                                                                                     | —                                                         |
| R-41 | The Annex 12 layout tables write a plate as distinguisher "+" vehicle part.                                                                   | 1709 Annex 12 pkt 2.12; Rys. 9, 11, 14, 16                    | —                                        | no: other (the "+" is a gap on the plate; a typed separator is optional; D-31 keeps group boundaries, #37 does not use them) | —                                                         |
| R-42 | The legalisation-sticker field marks the "+" gap.                                                                                             | 1709 Annex 12 pkt 2.6 lit. a                                  | —                                        | no: other                                                                                                                    | —                                                         |
| R-43 | Reduced plates of all three types share seven layouts with a one-letter distinguisher, matching pkt 2 lit. a–g in order.                      | 1709 Annex 12 Rys. 10                                         | —                                        | yes                                                                                                                          | `vehicle-part-templates.ts`                               |
| R-44 | Individual plates (car one-row and two-row, motorcycle) have twelve layouts after "1L, 1C".                                                   | 1709 Annex 12 Rys. 12, 13, 15                                 | —                                        | yes                                                                                                                          | `vehicle-part-templates.ts`                               |
| R-45 | Vintage car (one-row and two-row), motorcycle and moped plates all use the pkt 5 layouts.                                                     | 1709 Annex 12 Rys. 17–20                                      | —                                        | yes                                                                                                                          | `vehicle-part-templates.ts`                               |
| R-46 | Temporary car (one-row and two-row), motorcycle and moped plates use the pkt 6 layouts.                                                       | 1709 Annex 12 Rys. 21–24                                      | —                                        | yes                                                                                                                          | `vehicle-part-templates.ts`                               |
| R-47 | Plate backgrounds are white, yellow, blue or green.                                                                                           | 1709 Annex 12 pkt 2.14 lit. b                                 | —                                        | no: colour                                                                                                                   | —                                                         |
| R-48 | Annex 13 columns 4–5 serve ordinary, vintage and diplomatic plates; column 6 serves temporary and individual plates.                          | 1709 Annex 13 table header                                    | Table body: 939 § 1 pkt 4, 891 § 1 pkt 9 | yes                                                                                                                          | plate-data `registry.ts`; `readings.ts`; `parse-plate.ts` |
| R-49 | An individual distinguisher must be a word, abbreviation or expression with no offensive meaning.                                             | 1709 § 32 ust. 3                                              | —                                        | no: other (meaning, not characters; individual variant counts are an upper bound, D-43)                                      | —                                                         |

## Quotes

### R-01 — 1709 § 25 pkt 1–5

> „Do oznaczania pojazdów stosuje się następujące wzory tablic rejestracyjnych: 1) zwyczajne – do oznaczania wszystkich pojazdów, z zastrzeżeniem pkt 2–5; 2) indywidualne – do oznaczania pojazdów samochodowych; 3) zabytkowe – do oznaczania pojazdów zabytkowych; 4) tymczasowe – do oznaczania pojazdów czasowo zarejestrowanych; 5) dyplomatyczne – do oznaczania pojazdów należących do przedstawicielstw dyplomatycznych, urzędów konsularnych i misji specjalnych państw obcych oraz organizacji międzynarodowych, a także ich personelu.”

### R-02 — 1709 § 26 ust. 1 pkt 1 lit. a

> „Tablice rejestracyjne ze względu na rozmiary dzielą się na: 1) samochodowe: a) jednorzędowe i dwurzędowe – do oznaczania wszystkich rodzajów pojazdów, z wyjątkiem motocykli, ciągników rolniczych, motorowerów i pojazdów rodzaju „samochodowy inny” (kategorii L6e i L7e),”

### R-03 — 1709 § 26 ust. 1 pkt 1 lit. b

> „b) jednorzędowe zmniejszone – do oznaczania pojazdów silnikowych posiadających zmniejszone wymiary miejsca konstrukcyjnie przeznaczonego do umieszczenia tablicy rejestracyjnej, z wyłączeniem motocykli, ciągników rolniczych, pojazdów wolnobieżnych wchodzących w skład kolejki turystycznej i pojazdów rodzaju „samochodowy inny”;”

### R-04 — 1709 § 26 ust. 1 pkt 2–3

> „2) motocyklowe (dwurzędowe) – do oznaczania motocykli, ciągników rolniczych oraz pojazdów rodzaju „samochodowy inny” (kategorii L6e i L7e); 3) motorowerowe (dwurzędowe) – do oznaczania motorowerów.”

### R-05 — 1709 § 26 ust. 2–4

> „2. W przypadku ciągnika rolniczego mogą być stosowane tablice rejestracyjne samochodowe, jeżeli ciągnik rolniczy posiada odpowiadające takiej tablicy miejsce konstrukcyjnie przeznaczone do jej umieszczenia.” „3. W przypadku pojazdu wchodzącego w skład kolejki turystycznej, w zależności od miejsca konstrukcyjnie przeznaczonego do umieszczenia tablic rejestracyjnych, mogą być stosowane, ze względu na rozmiar, tablice rejestracyjne samochodowe lub motocyklowe.” „4. W przypadku pojazdu rodzaju „samochodowy inny” będącego pojazdem trzykołowym lub czterokołowym wyposażonym w nadwozie mogą być stosowane tablice rejestracyjne samochodowe, jeżeli pojazd ten posiada odpowiadające tym tablicom miejsce konstrukcyjnie przeznaczone do ich umieszczenia.”

### R-06 — 1709 § 27 ust. 2

> „Na tablicy rejestracyjnej zwyczajnej będącej tablicą rejestracyjną samochodową albo tablicą rejestracyjną motocyklową jest wytłoczony numer rejestracyjny: […] – składający się z wyróżnika województwa, wyróżnika powiatu i wyróżnika pojazdu.”

### R-07 — 1709 § 27 ust. 2 pkt 1–2

> „1) barwy czarnej na białym tle albo 2) barwy czarnej na zielonym tle w przypadku tablicy rejestracyjnej wydawanej dla pojazdu elektrycznego albo pojazdu napędzanego wodorem”

### R-08 — 1709 § 27 ust. 3

> „Na tablicy rejestracyjnej zwyczajnej będącej tablicą rejestracyjną samochodową jednorzędową zmniejszoną jest wytłoczony numer rejestracyjny: […] – składający się z wyróżnika województwa i wyróżnika pojazdu.”

### R-09 — 1709 § 27 ust. 3 pkt 1–2

> „1) barwy czarnej na białym tle albo 2) barwy czarnej na zielonym tle w przypadku tablicy rejestracyjnej wydawanej dla pojazdu elektrycznego albo pojazdu napędzanego wodorem”

### R-10 — 1709 § 27 ust. 4

> „Na tablicy rejestracyjnej indywidualnej jest wytłoczony numer rejestracyjny: […] – składający się z wyróżnika województwa i indywidualnego wyróżnika pojazdu.”

### R-11 — 1709 § 27 ust. 4 pkt 1–2

> „1) barwy czarnej na białym tle albo 2) barwy czarnej na zielonym tle w przypadku tablicy rejestracyjnej wydawanej dla pojazdu elektrycznego albo pojazdu napędzanego wodorem”

### R-12 — 1709 § 27 ust. 5

> Amending text: „w § 27 w ust. 5 w części wspólnej wyrazy „składający się z wyróżnika województwa i wyróżnika pojazdu” zastępuje się wyrazami „składający się z wyróżnika województwa, wyróżnika powiatu i wyróżnika pojazdu”;”

### R-13 — 1709 § 27 ust. 5 pkt 1–2

> „1) barwy czarnej na białym tle albo 2) barwy czarnej na zielonym tle w przypadku tablicy rejestracyjnej wydawanej dla motoroweru wyposażonego w silnik elektryczny”

### R-14 — 1709 § 27 ust. 6

> „Na tablicy rejestracyjnej zabytkowej jest wytłoczony numer rejestracyjny barwy czarnej na żółtym tle, składający się z wyróżnika województwa, wyróżnika powiatu i wyróżnika pojazdu, oraz symbol pojazdu zabytkowego barwy czarnej.”

### R-15 — 1709 § 27 ust. 6

> As R-14 („barwy czarnej na żółtym tle”, „symbol pojazdu zabytkowego barwy czarnej”)

### R-16 — 1709 § 27 ust. 7

> „Na tablicy rejestracyjnej zabytkowej jednorzędowej zmniejszonej jest wytłoczony numer rejestracyjny barwy czarnej na żółtym tle oraz naniesiona techniką laserową grafika symbolu przedstawionego na rysunku 3 w załączniku nr 12 do rozporządzenia.”

### R-17 — 1709 § 27 ust. 8

> „Na tablicy rejestracyjnej motorowerowej zabytkowej jest wytłoczony numer rejestracyjny barwy czarnej na żółtym tle oraz naniesiona techniką laserową grafika symbolu przedstawionego na rysunku 4 w załączniku nr 12 do rozporządzenia.”

### R-18 — 1709 § 27 ust. 9

> „Na tablicy rejestracyjnej tymczasowej jest wytłoczony numer rejestracyjny składający się z wyróżnika województwa oraz wyróżnika pojazdu:”

### R-19 — 1709 § 27 ust. 9 pkt 1–2

> „1) barwy czerwonej na białym tle albo 2) barwy czerwonej na żółtym tle w przypadku tablicy rejestracyjnej wydawanej dla samochodu osobowego przeznaczonego do zawodów sportowych.”

### R-20 — 1709 § 27 ust. 10

> „Na tablicy rejestracyjnej dyplomatycznej jest wytłoczony numer rejestracyjny barwy białej na niebieskim tle składający się z wyróżnika województwa i wyróżnika pojazdu.”

### R-21 — 1709 § 27 ust. 10

> As R-20 („barwy białej na niebieskim tle”)

### R-22 — 1709 § 28 ust. 1 zd. 2

> „Wymóg ten nie dotyczy tablic (tablicy) rejestracyjnych dyplomatycznych.”

### R-23 — 1709 § 30 ust. 1

> „Numery rejestracyjne są tworzone ze zbioru następujących 25 liter: A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, R, S, T, U, V, W, X, Y i Z oraz cyfr od 0 do 9.”

### R-24 — 1709 § 30 ust. 2 pkt 1 lit. a

> „na tablicach rejestracyjnych zwyczajnych samochodowych – pierwsza litera stanowi wyróżnik województwa, druga lub druga i trzecia litera stanowią wyróżnik powiatu, następne cyfry lub cyfry i litera lub litery stanowią wyróżnik pojazdu tworzony kolejno w układzie: a) w przypadku powiatów z wyróżnikiem jednoliterowym: – pięć cyfr w przedziale od 00001 do 99999, – cztery cyfry w przedziale od 0001 do 9999 i litera, – trzy cyfry w przedziale od 001 do 999 i dwie litery, – cyfra w przedziale od 1 do 9, litera i trzy cyfry w przedziale od 001 do 999, – cyfra w przedziale od 1 do 9, dwie litery i dwie cyfry w przedziale od 01 do 99,”

### R-25 — 1709 § 30 ust. 2 pkt 1 lit. b

> „b) w przypadku powiatów z wyróżnikiem dwuliterowym: – litera i trzy cyfry w przedziale od 001 do 999, – dwie cyfry w przedziale od 01 do 99 i dwie litery, – cyfra w przedziale od 1 do 9, litera i dwie cyfry w przedziale od 01 do 99, – dwie cyfry w przedziale od 01 do 99, litera i cyfra w przedziale od 1 do 9, – cyfra w przedziale od 1 do 9, dwie litery i cyfra w przedziale od 1 do 9, – dwie litery i dwie cyfry w przedziale od 01 do 99, – pięć cyfr w przedziale od 00001 do 99999, – cztery cyfry w przedziale od 0001 do 9999 i litera, – trzy cyfry w przedziale od 001 do 999 i dwie litery;”

### R-26 — 1709 § 30 ust. 2 pkt 2

> „na tablicach rejestracyjnych zwyczajnych samochodowych jednorzędowych zmniejszonych i na tablicach rejestracyjnych tymczasowych jednorzędowych zmniejszonych oraz na tablicach rejestracyjnych zabytkowych jednorzędowych zmniejszonych – wydawanych dla pojazdu posiadającego zmniejszone wymiary miejsca konstrukcyjnie przeznaczonego do umieszczenia tablicy rejestracyjnej – dla powiatów z wyróżnikiem jednoliterowym i dwuliterowym pierwsza litera stanowi wyróżnik województwa, następne cyfry lub cyfry i litera, lub litery stanowią wyróżnik pojazdu tworzony kolejno w układzie: a) trzy cyfry w przedziale od 001 do 999, b) dwie cyfry w przedziale od 01 do 99 i litera, c) cyfra w przedziale od 1 do 9, litera i cyfra w przedziale od 1 do 9, d) litera i dwie cyfry w przedziale od 01 do 99, e) cyfra w przedziale od 1 do 9 i dwie litery, f) dwie litery i cyfra w przedziale od 1 do 9, g) litera, cyfra w przedziale od 1 do 9 i litera;”

### R-27 — 1709 § 30 ust. 2 pkt 3 lit. a

> „na tablicach rejestracyjnych zwyczajnych motocyklowych i motorowerowych – pierwsza litera stanowi wyróżnik województwa, druga lub druga i trzecia litera stanowią wyróżnik powiatu, następne cyfry lub cyfry i litera, lub litery stanowią wyróżnik pojazdu tworzony kolejno w układzie: a) w przypadku powiatów z wyróżnikiem jednoliterowym: – cztery cyfry w przedziale od 0001 do 9999, – trzy cyfry w przedziale od 001 do 999 i litera, – dwie cyfry w przedziale od 01 do 99, litera i cyfra w przedziale od 1 do 9, – cyfra w przedziale od 1 do 9, litera i dwie cyfry w przedziale od 01 do 99, – litera i trzy cyfry w przedziale od 001 do 999, – dwie cyfry w przedziale od 01 do 99 i dwie litery, – cyfra w przedziale od 1 do 9, dwie litery i cyfra w przedziale od 1 do 9, – dwie litery i dwie cyfry w przedziale od 01 do 99,”

### R-28 — 1709 § 30 ust. 2 pkt 3 lit. b

> „b) w przypadku powiatów z wyróżnikiem dwuliterowym: – litera i trzy cyfry w przedziale od 001 do 999, – dwie cyfry w przedziale od 01 do 99 i dwie litery, – cyfra w przedziale od 1 do 9, litera i dwie cyfry w przedziale od 01 do 99, – dwie cyfry w przedziale od 01 do 99, litera i cyfra w przedziale od 1 do 9, – cyfra w przedziale od 1 do 9, dwie litery i cyfra w przedziale od 1 do 9, – dwie litery i dwie cyfry w przedziale od 01 do 99, – litera, dwie cyfry w przedziale od 01 do 99 i litera, – litera, cyfra w przedziale od 1 do 9 i dwie litery;”

### R-29 — 1709 § 30 ust. 2 pkt 4

> „na tablicach rejestracyjnych indywidualnych – litera i cyfra stanowią wyróżnik województwa, zaś kolejne litery w liczbie od 3 do 5 stanowią wyróżnik indywidualny pojazdu, w którym nie więcej niż dwie ostatnie litery można zastąpić cyframi;”

### R-30 — 1709 § 30 ust. 2 pkt 5 lit. a

> „na tablicach rejestracyjnych zabytkowych, z wyjątkiem tablic rejestracyjnych zabytkowych jednorzędowych zmniejszonych – pierwsza litera stanowi wyróżnik województwa, druga lub druga i trzecia litera stanowią wyróżnik powiatu, następne cyfry lub cyfry i litera stanowią wyróżnik pojazdu tworzony kolejno w układzie: a) w przypadku powiatów z wyróżnikiem jednoliterowym: – dwie cyfry w przedziale od 01 do 99 i litera, – trzy cyfry w przedziale od 001 do 999,”

### R-31 — 1709 § 30 ust. 2 pkt 5 lit. b

> „b) w przypadku powiatów z wyróżnikiem dwuliterowym: – cyfra w przedziale od 1 do 9 i litera, – dwie cyfry w przedziale od 01 do 99, – litera i cyfra w przedziale od 1 do 9;”

### R-32 — 1709 § 30 ust. 2 pkt 6

> „na tablicach rejestracyjnych tymczasowych – litera i cyfra stanowią wyróżnik województwa, zaś cztery cyfry w przedziale od 0001 do 9999 stanowią wyróżnik pojazdu, który po wyczerpaniu wskazanej pojemności tworzy się w układzie trzy cyfry w przedziale od 001 do 999 i litera;”

### R-33 — 1709 § 30 ust. 2 pkt 7

> „na tablicach rejestracyjnych dyplomatycznych – pierwsza litera stanowi wyróżnik województwa, zaś sześć cyfr w przedziale od 000001 do 999999 stanowi wyróżnik pojazdu.”

### R-34 — 1709 § 30 ust. 2 pkt 1 lit. a tiret 1; pkt 7 (representative)

> „pięć cyfr w przedziale od 00001 do 99999” … „sześć cyfr w przedziale od 000001 do 999999”

### R-35 — 1709 § 30 ust. 3

> „Organ rejestrujący może wydać dla pojazdu posiadającego zmniejszone wymiary miejsca konstrukcyjnie przeznaczonego do umieszczenia tablicy rejestracyjnej: 1) w przypadku czasowej rejestracji, o której mowa w art. 74 ust. 2 pkt 2 i ust. 2ca ustawy – tablice rejestracyjne tymczasowe jednorzędowe zmniejszone, 2) w przypadku rejestracji – tablice rejestracyjne zwyczajne samochodowe jednorzędowe zmniejszone – o tym samym numerze rejestracyjnym.”

### R-36 — 1709 § 31 ust. 1

> „Wyróżnik pojazdu, z zastrzeżeniem § 32 ust. 2, określa organ rejestrujący, posługując się zestawem cyfr i liter stanowiących pojemność rejestracyjną, z wyłączeniem liter B, D, I, O i Z.”

### R-37 — 1709 § 31 ust. 2

> „Wyróżniki województw i powiatów dla tablic rejestracyjnych są określone w załączniku nr 13 do rozporządzenia.”

### R-38 — 1709 § 32 ust. 1

> „Organ rejestrujący wydaje tablice (tablicę) rejestracyjne indywidualne, jeżeli z informacji uzyskanej z ewidencji tablic rejestracyjnych indywidualnych wydanych na terenie województwa, o której mowa w art. 73a ust. 1 pkt 1 ustawy, wynika, że identyczne tablice (tablica) rejestracyjne nie zostały wydane dla innego pojazdu zarejestrowanego na terenie województwa.”

### R-39 — 1709 § 32 ust. 2

> „2. Wyróżnik indywidualny pojazdu określa zainteresowany właściciel pojazdu. W przypadku gdy, zgodnie z załącznikiem nr 13 do rozporządzenia, dla województwa są określone dwie litery będące wyróżnikiem województwa, zainteresowany właściciel pojazdu może wskazać literę wyróżnika województwa, z którą będzie tworzony numer rejestracyjny pojazdu.”

### R-40 — 1709 Annex 12 pkt 1.1 pkt 1–3

> „1) rodzaj tablicy – tablicę zwyczajną, indywidualną, zabytkową, dyplomatyczną, tymczasową; 2) odmiana tablicy – tablicę jednorzędową, tj. przeznaczoną do usytuowania znaków w jednym rzędzie, lub dwurzędową, tj. przeznaczoną do usytuowania znaków w dwóch rzędach; 3) wzór tablicy – tablicę określonego rodzaju i odmiany;”

### R-41 — 1709 Annex 12 pkt 2.12; Rys. 9, 11, 14, 16

> „Rozmieszczenie znaków na tablicach powinno być zgodne z rysunkami 9–26, na których prostokątami z dwiema przekątnymi zaznaczono miejsce położenia liter, prostokątami z jedną przekątną zaznaczono położenie cyfr, a linią przerywaną określono położenie znaku legalizacyjnego.” Rys. 9: „Odmiany tablic rejestracyjnych samochodowych zwyczajnych jednorzędowych […] 1. 2L+5C […] 12. 3L+5C”

### R-42 — 1709 Annex 12 pkt 2.6 lit. a

> „– w przypadku tablic samochodowych jednorzędowych: – – w poziomie – symetrycznie między ostatnim znakiem wyróżnika województwa lub powiatu a pierwszym znakiem wyróżnika pojazdu,” … „– w przypadku tablic samochodowych dwurzędowych: – – w poziomie – symetrycznie pomiędzy ostatnim znakiem wyróżnika województwa lub powiatu a ramką obrzeża tablicy,” … „– w przypadku tablic motorowerowych: – – w poziomie – symetrycznie między ramką obrzeża tablicy a pierwszym znakiem wyróżnika pojazdu,”

### R-43 — 1709 Annex 12 Rys. 10

> „Rysunek 10. Tablice samochodowe jednorzędowe zmniejszone, w tym tablice rejestracyjne zabytkowe jednorzędowe zmniejszone oraz tablice tymczasowe dla pojazdu posiadającego zmniejszone wymiary miejsca konstrukcyjnie przeznaczonego do umieszczenia tablicy rejestracyjnej” — „1. 1L+3C 2. 1L+2C, 1L 3. 1L+1C, 1L, 1C 4. 1L+1L, 2C 5. 1L+1C, 2L 6. 1L+2L, 1C 7. 1L+1L, 1C, 1L”

### R-44 — 1709 Annex 12 Rys. 12, 13, 15

> Rys. 12: „Odmiany tablic rejestracyjnych samochodowych indywidualnych jednorzędowych […] 1. 1L, 1C+5L 2. 1L, 1C+4L, 1C 3. 1L, 1C+3L, 1C, 1L 4. 1L, 1C+3L, 2C 5. 1L, 1C+4L 6. 1L, 1C+3L, 1C 7. 1L, 1C+2L, 1C, 1L 8. 1L, 1C+2L, 2C 9. 1L, 1C+3L 10. 1L, 1C+2L, 1C 11. 1L, 1C+1L, 1C, 1L 12. 1L, 1C+1L, 2C” (Rys. 13 and 15 list the same twelve)

### R-45 — 1709 Annex 12 Rys. 17–20

> Rys. 20: „Rozmieszczenie znaków na tablicach rejestracyjnych motorowerowych zabytkowych: 1. 2l+2C, 1L 2. 2L+3C” and „1. 3L+1C, 1L 2. 3L+2C 3. 3L+1L, 1C”

### R-46 — 1709 Annex 12 Rys. 21–24

> „Rozmieszczenie znaków na tablicach rejestracyjnych samochodowych tymczasowych jednorzędowych: 1. 1L, 1C+4C 2. 1L, 1C+3C, 1L” (Rys. 22–24 list the same two)

### R-47 — 1709 Annex 12 pkt 2.14 lit. b

> „b) biała, żółta, niebieska lub zielona, jednolicie zabarwiona,”

### R-48 — 1709 Annex 13 table header

> „Wyróżnik na tablice rejestracyjne zwyczajne, zabytkowe i dyplomatyczne” (columns 4 „wyróżnik województwa” and 5 „wyróżnik powiatu”); „Wyróżnik na tablice rejestracyjne tymczasowe i indywidualne” (column 6)

### R-49 — 1709 § 32 ust. 3

> „Wyróżnik indywidualny powinien być wyrazem, skrótem lub określeniem, które nie zawierają w swoim znaczeniu w języku polskim albo obcym treści obraźliwych lub niezgodnych z zasadami współżycia społecznego.”

## Notes on rows

- **R-24.** After a one-letter powiat, five vehicle-part layouts are allowed.
- **R-26.** pkt 2 is the specific rule for temporary reduced plates and names the first letter as the voivodeship distinguisher. Column-6 codes (R-48) are column-4 letters of the same voivodeship plus a digit, so region1 is the same either way.
- **R-29.** No digit range is given, so "0" and "00" are accepted on individual plates (D-36).
- **R-30, R-31.** pkt 5 opens with „następne cyfry lub cyfry i litera”, but lit. b tiret 3 starts with a letter. The specific lit. b governs (D-36).
- **R-36, R-39.** The B/D/I/O/Z exception for individual plates comes from the base-text reservation „z zastrzeżeniem § 32 ust. 2” in § 31 ust. 1. 939 added only the choice of letter.
- **R-39.** Because the choice is only between the two letters of one voivodeship, the plate still carries a code of one voivodeship, and region1 is determined. Wording: the plate carries a voivodeship code; it does not say where the vehicle is registered (D-36).
- **R-41, R-42.** The extract does not define the Annex 12 notation (L = letter, C = digit, "+" = boundary); it is read from context. The two-row split is the "+": row 1 distinguisher, row 2 vehicle part, confirmed by the drawings in #39 (D-40). The Annex 12 layout tables for ordinary car, motorcycle and moped plates list the same layouts as pkt 1 and pkt 3. The legalisation-sticker field sits between the distinguisher and the vehicle part on one-row car plates; after the distinguisher on two-row car and motorcycle plates; before the vehicle part on moped plates.
- **R-37, R-48.** H and U are in the alphabet (R-23) but never in Annex 13 column 4; in the act they occur only as column-5 suffixes (m.st. Warszawa, Chorzów). A leading H or U is therefore `not-in-registry` (D-35).

## Read, not rows

§ 31 ust. 3 as amended by 939 § 1 pkt 2 (the second voivodeship letter is used only once the first is exhausted; „Wymóg ten nie dotyczy tablic (tablicy) rejestracyjnych indywidualnych.”) and § 31 ust. 4–5 (merged and split powiats keep their codes, D-07). Neither changes what the characters encode.

## Derived consequences

Derived by hand in #38 and pinned by literal expectations in `parse-plate.spec.ts` and `readings.spec.ts`:

1. At the winning level the characters determine the § 25 type, except for pkt 2 (R-26): ordinary, vintage or temporary, told apart only by colour (R-09, R-16, R-19, R-35). Example: `WA12`.
2. Car plates and motorcycle/moped plates after a two-letter powiat share six layouts (pkt 1 lit. b and pkt 3 lit. b, tirets 1–6), and motorcycle and moped plates share all of pkt 3. These differ in size only; the type is ordinary. Examples: `WOSAC12`, `LBI11AC`, `DWL123`.
3. pkt 4/6 never overlap pkt 2/7. Look-alike substitution keeps the length; reduced plates have 4 characters and column-6 plates 5–7. Diplomatic plates need digits at positions 4–7, while every 5-character individual layout has letters at positions 3–5, and only positions 2–3 are ever swapped.
4. pkt 4 never overlaps pkt 6. The second character of the vehicle part (position 4) is a digit on temporary plates and a letter in every 4-character individual layout, and position 4 is never swapped. Example: `S0I234` is temporary only.
5. `ambiguous` pairs one reading with region2 and one without. The reading with region2 is always ordinary (pkt 1 lit. a or pkt 3 lit. a) or vintage (pkt 5 lit. a) after a two-character code ending in O or I. The reading without region2 is always individual. Examples: `WOO1A` and `WII22` (vintage with individual); `WIIK12` and `WIIKK12` (ordinary with individual).
6. No region2 has a one-letter suffix that starts one of its own two-letter suffixes, so no region2 is read through both a two-character and a three-character code. Pinned by a registry invariant in `parse-plate.spec.ts` (literal empty violations list).

## Out of scope

Military, service and trade/test plates: not regulated by 1709, 939 or 891 (D-35, follow-up #60). Documents not consulted: ustawa z dnia 20 czerwca 1997 r. – Prawo o ruchu drogowym (Dz. U. z 2024 r. poz. 1251, z późn. zm.); Annex 12 Rys. 18–26 (images); Rys. 11, 13–16 were read in #39 (D-40).
