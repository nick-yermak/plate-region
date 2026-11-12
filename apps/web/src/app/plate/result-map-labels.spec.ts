import {
  countyMapLoaders,
  fullCodes,
  loadCountryMap,
  loadWarsawDistrictMap,
  type CountryMap,
  type CountyMap,
  type WarsawDistrictMap,
} from '@plate-region/plate-data';

import { resultMapTarget } from './result-map';
import type { MapView } from '../shared/map/map.types';
import { countryMapView } from '../shared/map/map-view';
import { resultPlateCode, resultView } from './result-view';
import {
  voivodeshipDialogMapView,
  warsawDialogMapView,
} from '../shared/map/dialog-map-view';

function filledArea(view: MapView): MapView['areas'][number] {
  const area = view.areas.find((entry) => entry.filled);
  if (area === undefined) {
    throw new Error('no filled area');
  }
  return area;
}

describe('result map labels use resultPlateCode', () => {
  let country: CountryMap;
  let lowerSilesia: CountyMap;
  let warsaw: WarsawDistrictMap;

  beforeAll(async () => {
    const loadD = countyMapLoaders['D'];
    if (loadD === undefined) {
      throw new Error('no Lower Silesian map loader');
    }
    [country, lowerSilesia, warsaw] = await Promise.all([
      loadCountryMap(),
      loadD(),
      loadWarsawDistrictMap(),
    ]);
  });

  it('VX12345: Wrocław labelled VX on the map of Poland and the dialog map', () => {
    const plate = 'VX12345';
    const code = resultPlateCode(resultView(plate, 'en'));
    expect(code).toBe('VX');
    const target = resultMapTarget(plate);
    if (target === undefined || target.kind !== 'voivodeship') {
      throw new Error('expected voivodeship target');
    }
    const countryFilled = filledArea(
      countryMapView(country, target.region1, target.filled, 'en', code),
    );
    expect(countryFilled.label.codeText).toBe('VX');
    expect(countryFilled.label.text).toBe('Wrocław (VX)');
    const dialogFilled = filledArea(
      voivodeshipDialogMapView(
        lowerSilesia,
        target.region1,
        target.filled,
        code,
        'en',
        country,
      ),
    );
    expect(dialogFilled.label.codeText).toBe('VX');
    expect(dialogFilled.label.text).toBe('Wrocław (VX)');
  });

  it('WY1234V: m.st. Warszawa labelled WY on the Masovian dialog map and the map of Poland', async () => {
    const plate = 'WY1234V';
    const code = resultPlateCode(resultView(plate, 'en'));
    expect(code).toBe('WY');
    const target = resultMapTarget(plate);
    if (target === undefined || target.kind !== 'voivodeship') {
      throw new Error('expected Masovian voivodeship target');
    }
    expect(target.filled?.name).toBe('m.st. Warszawa');
    const loadW = countyMapLoaders['W'];
    if (loadW === undefined) {
      throw new Error('no Masovian map loader');
    }
    const masovia = await loadW();
    const countryFilled = filledArea(
      countryMapView(country, target.region1, target.filled, 'en', code),
    );
    expect(countryFilled.label.codeText).toBe('WY');
    expect(countryFilled.label.text).toBe('Warszawa (WY)');
    const dialogFilled = filledArea(
      voivodeshipDialogMapView(
        masovia,
        target.region1,
        target.filled,
        code,
        'en',
        country,
      ),
    );
    expect(dialogFilled.label.codeText).toBe('WY');
    expect(dialogFilled.label.text).toBe('Warszawa (WY)');
  });

  it('WE12345: m.st. Warszawa labelled WE on the map of Poland', () => {
    const plate = 'WE12345';
    const code = resultPlateCode(resultView(plate, 'en'));
    expect(code).toBe('WE');
    const target = resultMapTarget(plate);
    if (target === undefined || target.kind !== 'warsaw') {
      throw new Error('expected Warsaw target');
    }
    const countryFilled = filledArea(
      countryMapView(country, target.region1, target.filled, 'en', code),
    );
    expect(countryFilled.label.codeText).toBe('WE');
    expect(countryFilled.label.text).toBe('Warszawa (WE)');
  });

  it('AE12345: Mokotów labelled AE on the Warsaw dialog map; Warszawa AE on Poland', () => {
    const plate = 'AE12345';
    const code = resultPlateCode(resultView(plate, 'en'));
    expect(code).toBe('AE');
    const target = resultMapTarget(plate);
    if (target === undefined || target.kind !== 'warsaw') {
      throw new Error('expected Warsaw target');
    }
    const dialogFilled = filledArea(
      warsawDialogMapView(warsaw, target.region1, target.districts, code, 'en'),
    );
    expect(dialogFilled.label.codeText).toBe('AE');
    expect(dialogFilled.label.text).toBe('Mokotów (AE)');
    const countryFilled = filledArea(
      countryMapView(country, target.region1, target.filled, 'en', code),
    );
    expect(countryFilled.label.codeText).toBe('AE');
    expect(countryFilled.label.text).toBe('Warszawa (AE)');
  });

  it('candidates VX: Wrocław labelled VX on both maps (answer code ≠ first code DW)', () => {
    const plate = 'VX';
    const view = resultView(plate, 'en');
    expect(view.kind).toBe('candidates');
    if (view.kind !== 'candidates') {
      throw new Error('expected candidates');
    }
    const answer = view.candidates.answer;
    expect(answer?.region2.name).toBe('Wrocław');
    if (answer === undefined) {
      throw new Error('expected answer');
    }
    const firstCode = fullCodes(view.candidates.region1, answer.region2)[0];
    expect(firstCode).toBe('DW');
    const code = resultPlateCode(view);
    expect(code).toBe('VX');
    expect(code).not.toBe(firstCode);
    const target = resultMapTarget(plate);
    if (target === undefined || target.kind !== 'voivodeship') {
      throw new Error('expected voivodeship target');
    }
    expect(target.filled?.name).toBe('Wrocław');
    const countryFilled = filledArea(
      countryMapView(country, target.region1, target.filled, 'en', code),
    );
    expect(countryFilled.label.codeText).toBe('VX');
    expect(countryFilled.label.text).toBe('Wrocław (VX)');
    const dialogFilled = filledArea(
      voivodeshipDialogMapView(
        lowerSilesia,
        target.region1,
        target.filled,
        code,
        'en',
        country,
      ),
    );
    expect(dialogFilled.label.codeText).toBe('VX');
    expect(dialogFilled.label.text).toBe('Wrocław (VX)');
  });
});
