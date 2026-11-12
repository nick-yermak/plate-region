import { county, voivodeship } from './plate.testing';
import { resultPlateCode, resultView } from './result-view';

describe('resultPlateCode', () => {
  it('resolved → its code', () => {
    expect(resultPlateCode(resultView('VX12345', 'en'))).toBe('VX');
  });

  it('ambiguous with a powiat → its code', () => {
    expect(resultPlateCode(resultView('WOO1A', 'en'))).toBe('WO');
  });

  it('candidates with an answer → the normalised input that selected it', () => {
    expect(resultPlateCode(resultView('VX', 'en'))).toBe('VX');
  });

  it('otherwise undefined', () => {
    expect(resultPlateCode(resultView('WA12', 'en'))).toBeUndefined();
    expect(resultPlateCode(resultView('GK', 'en'))).toBeUndefined();
    expect(resultPlateCode(resultView('2A12345', 'en'))).toBeUndefined();
  });
});

describe('resultView', () => {
  it('resolved DW 12345 → city reading with DW anchor', () => {
    expect(resultView('DW 12345', 'en')).toEqual({
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
          districts: undefined,
          link: { slug: 'dolnoslaskie', fragment: 'DW' },
        },
      ],
    });
  });

  it('resolved WW12345 → mazowieckie fragment WW', () => {
    const view = resultView('WW12345', 'en');
    expect(view.kind).toBe('readings');
    if (view.kind !== 'readings') {
      throw new Error('expected readings');
    }
    expect(view.readings[0].link).toEqual({
      slug: 'mazowieckie',
      fragment: 'WW',
    });
  });

  it('candidates WW → mazowieckie fragment WW', () => {
    const view = resultView('WW', 'en');
    expect(view.kind).toBe('candidates');
    if (view.kind !== 'candidates') {
      throw new Error('expected candidates');
    }
    expect(view.link).toEqual({ slug: 'mazowieckie', fragment: 'WW' });
  });

  it('region1-only WA12 → voivodeship heading and possible types', () => {
    expect(resultView('WA12', 'en')).toEqual({
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
          districts: undefined,
          link: { slug: 'mazowieckie', fragment: undefined },
        },
      ],
    });
  });

  it('ambiguous WOO1A → with-county and without-county readings', () => {
    expect(resultView('WOO1A', 'en')).toEqual({
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
          districts: undefined,
          link: { slug: 'mazowieckie', fragment: 'WO' },
        },
        {
          captionKey: 'plate.reading.withoutCounty',
          powiat: undefined,
          voivodeshipName: voivodeship('W').nameEn.value,
          typesLabelKey: 'plate.reading.type',
          plateTypes: ['individual'],
          districts: undefined,
          link: { slug: 'mazowieckie', fragment: undefined },
        },
      ],
    });
  });

  it('region2-not-in-registry DA12345 → note and link without fragment', () => {
    expect(resultView('DA12345', 'en')).toEqual({
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
          districts: undefined,
          link: { slug: 'dolnoslaskie', fragment: undefined },
        },
      ],
    });
  });

  it('not-in-registry HA12345 → message', () => {
    expect(resultView('HA12345', 'en')).toEqual({
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
    expect(resultView(input, 'en')).toEqual({
      kind: 'message',
      heading: { key },
    });
  });

  it('invalid-characters DW 1234Q → characters param', () => {
    expect(resultView('DW 1234Q', 'en')).toEqual({
      kind: 'message',
      heading: {
        key: 'plate.messages.invalidCharacters',
        params: { characters: 'Q' },
      },
    });
  });

  it('no-matching-format 2A12345 → message', () => {
    expect(resultView('2A12345', 'en')).toEqual({
      kind: 'message',
      heading: { key: 'plate.messages.noMatchingFormat' },
    });
  });

  it('empty separator-only input → message', () => {
    expect(resultView(' -. ', 'en')).toEqual({
      kind: 'message',
      heading: { key: 'plate.messages.empty' },
    });
  });

  it('resolved VX12345 → city reading with VX anchor', () => {
    expect(resultView('VX12345', 'en')).toEqual({
      kind: 'readings',
      heading: {
        key: 'county.heading.city',
        params: { name: county('VX').name },
      },
      noteKey: undefined,
      readings: [
        {
          captionKey: undefined,
          powiat: { name: county('VX').name, kindKey: 'plate.kind.city' },
          voivodeshipName: voivodeship('D').nameEn.value,
          typesLabelKey: 'plate.reading.type',
          plateTypes: ['ordinary'],
          districts: undefined,
          link: { slug: 'dolnoslaskie', fragment: 'VX' },
        },
      ],
    });
  });

  it('region1-only WA12 in PL → Polish voivodeship name', () => {
    expect(resultView('WA12', 'pl')).toEqual({
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
          districts: undefined,
          link: { slug: 'mazowieckie', fragment: undefined },
        },
      ],
    });
  });

  it('candidates GD → city answer with link and others', () => {
    expect(resultView('GD', 'en')).toEqual({
      kind: 'candidates',
      heading: {
        key: 'county.heading.city',
        params: { name: county('GD').name },
      },
      candidates: expect.objectContaining({
        answer: expect.objectContaining({
          codes: ['GD'],
          region2: expect.objectContaining({ name: county('GD').name }),
        }),
        counties: [
          expect.objectContaining({
            codes: ['GDA'],
            region2: expect.objectContaining({ name: county('GDA').name }),
          }),
        ],
      }),
      link: { slug: 'pomorskie', fragment: 'GD' },
    });
  });

  it('candidates GDA → land answer listing GD', () => {
    const view = resultView('GDA', 'en');
    expect(view.kind).toBe('candidates');
    if (view.kind !== 'candidates') {
      throw new Error('expected candidates');
    }
    expect(view.heading).toEqual({
      key: 'county.heading.land',
      params: { name: county('GDA').name },
    });
    expect(view.link).toEqual({ slug: 'pomorskie', fragment: 'GDA' });
    expect(view.candidates.counties.map((entry) => entry.codes)).toEqual([
      ['GD'],
    ]);
  });

  it('candidates VX → answer without counties, VX link', () => {
    const view = resultView('VX', 'en');
    expect(view.kind).toBe('candidates');
    if (view.kind !== 'candidates') {
      throw new Error('expected candidates');
    }
    expect(view.heading).toEqual({
      key: 'county.heading.city',
      params: { name: county('VX').name },
    });
    expect(view.candidates.counties).toEqual([]);
    expect(view.candidates.withoutRegion2).toBe(true);
    expect(view.link).toEqual({ slug: 'dolnoslaskie', fragment: 'VX' });
  });

  it('candidates GK → voivodeship heading, three counties, no link', () => {
    const view = resultView('GK', 'en');
    expect(view.kind).toBe('candidates');
    if (view.kind !== 'candidates') {
      throw new Error('expected candidates');
    }
    expect(view.heading).toEqual({
      key: 'plate.heading.voivodeship',
      params: { name: voivodeship('G').nameEn.value },
    });
    expect(view.candidates.answer).toBeUndefined();
    expect(view.candidates.counties).toHaveLength(3);
    expect(view.link).toBeUndefined();
  });

  it('candidates GD 1 → no answer, Gdańsk listed', () => {
    const view = resultView('GD 1', 'en');
    expect(view.kind).toBe('candidates');
    if (view.kind !== 'candidates') {
      throw new Error('expected candidates');
    }
    expect(view.heading).toEqual({
      key: 'plate.heading.voivodeship',
      params: { name: voivodeship('G').nameEn.value },
    });
    expect(view.candidates.answer).toBeUndefined();
    expect(view.candidates.counties).toHaveLength(1);
    expect(view.candidates.counties[0]?.codes).toEqual(['GD']);
    expect(view.link).toBeUndefined();
  });

  it('candidates DWR1234 → one county, no answer', () => {
    const view = resultView('DWR1234', 'en');
    expect(view.kind).toBe('candidates');
    if (view.kind !== 'candidates') {
      throw new Error('expected candidates');
    }
    expect(view.heading).toEqual({
      key: 'plate.heading.voivodeship',
      params: { name: voivodeship('D').nameEn.value },
    });
    expect(view.candidates.answer).toBeUndefined();
    expect(view.candidates.counties).toHaveLength(1);
    expect(view.candidates.counties[0]?.codes).toEqual(['DWR']);
    expect(view.link).toBeUndefined();
  });

  it('resolved WE 12345 → reading districts Mokotów', () => {
    const view = resultView('WE 12345', 'en');
    expect(view.kind).toBe('readings');
    if (view.kind !== 'readings') {
      throw new Error('expected readings');
    }
    expect(view.readings[0].districts).toEqual(['Mokotów']);
  });

  it('resolved WW 12345 → three districts', () => {
    const view = resultView('WW 12345', 'en');
    expect(view.kind).toBe('readings');
    if (view.kind !== 'readings') {
      throw new Error('expected readings');
    }
    expect(view.readings[0].districts).toEqual([
      'Rembertów',
      'Wilanów',
      'Włochy',
    ]);
  });

  it('resolved DW 12345 → districts undefined', () => {
    const view = resultView('DW 12345', 'en');
    expect(view.kind).toBe('readings');
    if (view.kind !== 'readings') {
      throw new Error('expected readings');
    }
    expect(view.readings[0].districts).toBeUndefined();
  });

  it('ambiguous WIIKK12 → with-county Śródmieście, without-county undefined', () => {
    const view = resultView('WIIKK12', 'en');
    expect(view.kind).toBe('readings');
    if (view.kind !== 'readings') {
      throw new Error('expected readings');
    }
    expect(view.readings.length).toBe(2);
    if (view.readings.length !== 2) {
      throw new Error('expected two readings');
    }
    expect(view.readings[0].districts).toEqual(['Śródmieście']);
    expect(view.readings[1].districts).toBeUndefined();
  });
});
