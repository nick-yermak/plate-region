import type {
  CountyMap,
  CountyMapProvenance,
  WarsawDistrictMap,
} from './model';

export const countyMapProvenance = {
  title: 'GUGiK, Państwowy Rejestr Granic — jednostki administracyjne',
  url: 'https://opendata.geoportal.gov.pl/prg/granice/00_jednostki_administracyjne.zip',
  downloaded: '2026-11-11',
  sha256: 'e8699acc51377e267ecad6ceda02e35d9a1d42abb64551852d33757b2bc2ec5f',
} as const satisfies CountyMapProvenance;

export const countyMapWaterProvenance = {
  title:
    'GUGiK, Państwowy Rejestr Granic — granice specjalne (morskie wody wewnętrzne)',
  url: 'https://opendata.geoportal.gov.pl/prg/granice/00_granice_specjalne_shp.zip',
  downloaded: '2026-11-11',
  sha256: '5d9281ada2a70e259cf67e4847a9df69e4f91c2705f9f65ff04c1f96c07817af',
} as const satisfies CountyMapProvenance;

export const countyMapLoaders: Readonly<
  Record<string, () => Promise<CountyMap>>
> = {
  D: () => import('./county-map-d').then((m) => m.countyMap),
  C: () => import('./county-map-c').then((m) => m.countyMap),
  L: () => import('./county-map-l').then((m) => m.countyMap),
  F: () => import('./county-map-f').then((m) => m.countyMap),
  E: () => import('./county-map-e').then((m) => m.countyMap),
  K: () => import('./county-map-k').then((m) => m.countyMap),
  W: () => import('./county-map-w').then((m) => m.countyMap),
  O: () => import('./county-map-o').then((m) => m.countyMap),
  R: () => import('./county-map-r').then((m) => m.countyMap),
  B: () => import('./county-map-b').then((m) => m.countyMap),
  G: () => import('./county-map-g').then((m) => m.countyMap),
  S: () => import('./county-map-s').then((m) => m.countyMap),
  T: () => import('./county-map-t').then((m) => m.countyMap),
  N: () => import('./county-map-n').then((m) => m.countyMap),
  P: () => import('./county-map-p').then((m) => m.countyMap),
  Z: () => import('./county-map-z').then((m) => m.countyMap),
};

export function loadWarsawDistrictMap(): Promise<WarsawDistrictMap> {
  return import('./warsaw-district-map').then((m) => m.warsawDistrictMap);
}
