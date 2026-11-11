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

export const countyMapLoaders: Readonly<
  Record<string, () => Promise<CountyMap>>
> = {};

export function loadWarsawDistrictMap(): Promise<WarsawDistrictMap> {
  return Promise.reject(new Error('county maps are not generated yet'));
}
