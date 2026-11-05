import { parsePlate } from '@plate-region/plate-domain';

import { resultView } from './result-view';
import { county, voivodeship } from './plate.testing';

describe('resultView', () => {
  it('resolved DW 12345 → city reading with DW anchor', () => {
    expect(resultView(parsePlate('DW 12345'), 'en')).toEqual({
      kind: 'readings',
      heading: {
        key: 'county.heading.city',
        params: { name: county('DW').name },
      },
      noteKey: undefined,
      readings: [
        {
          captionKey: undefined,
          powiat: { name: county('DW').name, kindKey: 'plate.kind.city' },
          voivodeshipName: voivodeship('D').nameEn.value,
          typesLabelKey: 'plate.reading.type',
          plateTypes: ['ordinary'],
          link: { slug: 'dolnoslaskie', fragment: 'DW' },
        },
      ],
    });
  });

  it('region1-only WA12 → voivodeship heading and possible types', () => {
    expect(resultView(parsePlate('WA12'), 'en')).toEqual({
      kind: 'readings',
      heading: {
        key: 'plate.heading.voivodeship',
        params: { name: voivodeship('W').nameEn.value },
      },
      noteKey: 'plate.notes.region1Only',
      readings: [
        {
          captionKey: undefined,
          powiat: undefined,
          voivodeshipName: voivodeship('W').nameEn.value,
          typesLabelKey: 'plate.reading.possibleTypes',
          plateTypes: ['ordinary', 'vintage', 'temporary'],
          link: { slug: 'mazowieckie', fragment: undefined },
        },
      ],
    });
  });

  it('ambiguous WOO1A → with-county and without-county readings', () => {
    expect(resultView(parsePlate('WOO1A'), 'en')).toEqual({
      kind: 'readings',
      heading: {
        key: 'plate.heading.voivodeship',
        params: { name: voivodeship('W').nameEn.value },
      },
      noteKey: 'plate.notes.ambiguous',
      readings: [
        {
          captionKey: 'plate.reading.withCounty',
          powiat: { name: county('WO').name, kindKey: 'plate.kind.city' },
          voivodeshipName: voivodeship('W').nameEn.value,
          typesLabelKey: 'plate.reading.type',
          plateTypes: ['vintage'],
          link: { slug: 'mazowieckie', fragment: 'WO' },
        },
        {
          captionKey: 'plate.reading.withoutCounty',
          powiat: undefined,
          voivodeshipName: voivodeship('W').nameEn.value,
          typesLabelKey: 'plate.reading.type',
          plateTypes: ['individual'],
          link: { slug: 'mazowieckie', fragment: undefined },
        },
      ],
    });
  });

  it('region2-not-in-registry DA12345 → note and link without fragment', () => {
    expect(resultView(parsePlate('DA12345'), 'en')).toEqual({
      kind: 'readings',
      heading: {
        key: 'plate.heading.voivodeship',
        params: { name: voivodeship('D').nameEn.value },
      },
      noteKey: 'plate.notes.region2NotInRegistry',
      readings: [
        {
          captionKey: undefined,
          powiat: undefined,
          voivodeshipName: voivodeship('D').nameEn.value,
          typesLabelKey: 'plate.reading.type',
          plateTypes: ['ordinary'],
          link: { slug: 'dolnoslaskie', fragment: undefined },
        },
      ],
    });
  });

  it('not-in-registry HA12345 → message', () => {
    expect(resultView(parsePlate('HA12345'), 'en')).toEqual({
      kind: 'message',
      heading: { key: 'plate.messages.notInRegistry' },
    });
  });

  it.each([
    {
      input: 'UA 12345',
      key: 'plate.series.armedForces',
    },
    {
      input: 'HBA 12AA',
      key: 'plate.series.stateProtectionService',
    },
    {
      input: 'HPN 12AA',
      key: 'plate.series.police',
    },
    {
      input: 'HKA 12AA',
      key: 'plate.series.abwAw',
    },
    {
      input: 'HAA 12AA',
      key: 'plate.series.cba',
    },
    {
      input: 'HWA 12AA',
      key: 'plate.series.borderGuard',
    },
    {
      input: 'HCA 12AA',
      key: 'plate.series.customsAndTaxService',
    },
    {
      input: 'HMA 12AA',
      key: 'plate.series.skwSww',
    },
  ])('not-in-registry $input → $key', ({ input, key }) => {
    expect(resultView(parsePlate(input), 'en')).toEqual({
      kind: 'message',
      heading: { key },
    });
  });

  it('invalid-characters DW 1234Q → characters param', () => {
    expect(resultView(parsePlate('DW 1234Q'), 'en')).toEqual({
      kind: 'message',
      heading: {
        key: 'plate.messages.invalidCharacters',
        params: { characters: 'Q' },
      },
    });
  });

  it('no-matching-format DWR1234 → message', () => {
    expect(resultView(parsePlate('DWR1234'), 'en')).toEqual({
      kind: 'message',
      heading: { key: 'plate.messages.noMatchingFormat' },
    });
  });

  it('empty separator-only input → message', () => {
    expect(resultView(parsePlate(' -. '), 'en')).toEqual({
      kind: 'message',
      heading: { key: 'plate.messages.empty' },
    });
  });

  it('resolved VX12345 → primary DW anchor', () => {
    expect(resultView(parsePlate('VX12345'), 'en')).toEqual({
      kind: 'readings',
      heading: {
        key: 'county.heading.city',
        params: { name: county('DW').name },
      },
      noteKey: undefined,
      readings: [
        {
          captionKey: undefined,
          powiat: { name: county('DW').name, kindKey: 'plate.kind.city' },
          voivodeshipName: voivodeship('D').nameEn.value,
          typesLabelKey: 'plate.reading.type',
          plateTypes: ['ordinary'],
          link: { slug: 'dolnoslaskie', fragment: 'DW' },
        },
      ],
    });
  });

  it('region1-only WA12 in PL → Polish voivodeship name', () => {
    expect(resultView(parsePlate('WA12'), 'pl')).toEqual({
      kind: 'readings',
      heading: {
        key: 'plate.heading.voivodeship',
        params: { name: voivodeship('W').name },
      },
      noteKey: 'plate.notes.region1Only',
      readings: [
        {
          captionKey: undefined,
          powiat: undefined,
          voivodeshipName: voivodeship('W').name,
          typesLabelKey: 'plate.reading.possibleTypes',
          plateTypes: ['ordinary', 'vintage', 'temporary'],
          link: { slug: 'mazowieckie', fragment: undefined },
        },
      ],
    });
  });
});
