/** Characters a registration number is formed from: 25 letters without Q, and digits 0–9 (§ 30 ust. 1 Dz.U. 2024 poz. 1709, R-23). */
export const PLATE_ALPHABET: ReadonlySet<string> = new Set(
  'ABCDEFGHIJKLMNOPRSTUVWXYZ0123456789',
);
