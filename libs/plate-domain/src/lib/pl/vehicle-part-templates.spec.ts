import {
  COLUMN_4_5_TEMPLATES,
  COLUMN_4_TEMPLATES,
  COLUMN_6_TEMPLATES,
  type VehiclePartTemplate,
} from './vehicle-part-templates';

/** Literal table in § 30 ust. 2 order, with plateTypes and rows (D-34, D-33). */
const EXPECTED_TEMPLATES: readonly VehiclePartTemplate[] = [
  {
    layout: 'DDD',
    plateTypes: ['ordinary', 'vintage', 'temporary'],
    source: '§ 30 ust. 2 pkt 2 lit. a',
    rows: ['R-26', 'R-43'],
  },
  {
    layout: 'DDL',
    plateTypes: ['ordinary', 'vintage', 'temporary'],
    source: '§ 30 ust. 2 pkt 2 lit. b',
    rows: ['R-26', 'R-43'],
  },
  {
    layout: 'DLD',
    plateTypes: ['ordinary', 'vintage', 'temporary'],
    source: '§ 30 ust. 2 pkt 2 lit. c',
    rows: ['R-26', 'R-43'],
  },
  {
    layout: 'LDD',
    plateTypes: ['ordinary', 'vintage', 'temporary'],
    source: '§ 30 ust. 2 pkt 2 lit. d',
    rows: ['R-26', 'R-43'],
  },
  {
    layout: 'DLL',
    plateTypes: ['ordinary', 'vintage', 'temporary'],
    source: '§ 30 ust. 2 pkt 2 lit. e',
    rows: ['R-26', 'R-43'],
  },
  {
    layout: 'LLD',
    plateTypes: ['ordinary', 'vintage', 'temporary'],
    source: '§ 30 ust. 2 pkt 2 lit. f',
    rows: ['R-26', 'R-43'],
  },
  {
    layout: 'LDL',
    plateTypes: ['ordinary', 'vintage', 'temporary'],
    source: '§ 30 ust. 2 pkt 2 lit. g',
    rows: ['R-26', 'R-43'],
  },
  {
    layout: 'DDDDDD',
    plateTypes: ['diplomatic'],
    source: '§ 30 ust. 2 pkt 7',
    rows: ['R-33'],
  },
  {
    layout: 'DDDDD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 1 lit. a tiret 1',
    rows: ['R-24'],
  },
  {
    layout: 'DDDDL',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 1 lit. a tiret 2',
    rows: ['R-24'],
  },
  {
    layout: 'DDDLL',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 1 lit. a tiret 3',
    rows: ['R-24'],
  },
  {
    layout: 'DLDDD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 1 lit. a tiret 4',
    rows: ['R-24'],
  },
  {
    layout: 'DLLDD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 1 lit. a tiret 5',
    rows: ['R-24'],
  },
  {
    layout: 'DDDD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 3 lit. a tiret 1',
    rows: ['R-27'],
  },
  {
    layout: 'DDDL',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 3 lit. a tiret 2',
    rows: ['R-27'],
  },
  {
    layout: 'DDLD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 3 lit. a tiret 3',
    rows: ['R-27'],
  },
  {
    layout: 'DLDD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 3 lit. a tiret 4',
    rows: ['R-27'],
  },
  {
    layout: 'LDDD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 3 lit. a tiret 5',
    rows: ['R-27'],
  },
  {
    layout: 'DDLL',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 3 lit. a tiret 6',
    rows: ['R-27'],
  },
  {
    layout: 'DLLD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 3 lit. a tiret 7',
    rows: ['R-27'],
  },
  {
    layout: 'LLDD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 3 lit. a tiret 8',
    rows: ['R-27'],
  },
  {
    layout: 'DDL',
    plateTypes: ['vintage'],
    source: '§ 30 ust. 2 pkt 5 lit. a tiret 1',
    rows: ['R-30', 'R-45'],
  },
  {
    layout: 'DDD',
    plateTypes: ['vintage'],
    source: '§ 30 ust. 2 pkt 5 lit. a tiret 2',
    rows: ['R-30', 'R-45'],
  },
  {
    layout: 'LDDD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 1 lit. b tiret 1',
    rows: ['R-25'],
  },
  {
    layout: 'DDLL',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 1 lit. b tiret 2',
    rows: ['R-25'],
  },
  {
    layout: 'DLDD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 1 lit. b tiret 3',
    rows: ['R-25'],
  },
  {
    layout: 'DDLD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 1 lit. b tiret 4',
    rows: ['R-25'],
  },
  {
    layout: 'DLLD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 1 lit. b tiret 5',
    rows: ['R-25'],
  },
  {
    layout: 'LLDD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 1 lit. b tiret 6',
    rows: ['R-25'],
  },
  {
    layout: 'DDDDD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 1 lit. b tiret 7',
    rows: ['R-25'],
  },
  {
    layout: 'DDDDL',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 1 lit. b tiret 8',
    rows: ['R-25'],
  },
  {
    layout: 'DDDLL',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 1 lit. b tiret 9',
    rows: ['R-25'],
  },
  {
    layout: 'LDDD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 3 lit. b tiret 1',
    rows: ['R-28'],
  },
  {
    layout: 'DDLL',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 3 lit. b tiret 2',
    rows: ['R-28'],
  },
  {
    layout: 'DLDD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 3 lit. b tiret 3',
    rows: ['R-28'],
  },
  {
    layout: 'DDLD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 3 lit. b tiret 4',
    rows: ['R-28'],
  },
  {
    layout: 'DLLD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 3 lit. b tiret 5',
    rows: ['R-28'],
  },
  {
    layout: 'LLDD',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 3 lit. b tiret 6',
    rows: ['R-28'],
  },
  {
    layout: 'LDDL',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 3 lit. b tiret 7',
    rows: ['R-28'],
  },
  {
    layout: 'LDLL',
    plateTypes: ['ordinary'],
    source: '§ 30 ust. 2 pkt 3 lit. b tiret 8',
    rows: ['R-28'],
  },
  {
    layout: 'DL',
    plateTypes: ['vintage'],
    source: '§ 30 ust. 2 pkt 5 lit. b tiret 1',
    rows: ['R-31', 'R-45'],
  },
  {
    layout: 'DD',
    plateTypes: ['vintage'],
    source: '§ 30 ust. 2 pkt 5 lit. b tiret 2',
    rows: ['R-31', 'R-45'],
  },
  {
    layout: 'LD',
    plateTypes: ['vintage'],
    source: '§ 30 ust. 2 pkt 5 lit. b tiret 3',
    rows: ['R-31', 'R-45'],
  },
  {
    layout: 'DDDD',
    plateTypes: ['temporary'],
    source: '§ 30 ust. 2 pkt 6',
    rows: ['R-32', 'R-46'],
  },
  {
    layout: 'DDDL',
    plateTypes: ['temporary'],
    source: '§ 30 ust. 2 pkt 6 — po wyczerpaniu',
    rows: ['R-32', 'R-46'],
  },
  {
    layout: 'LLLLL',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 1',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLLLD',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 2',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLLDL',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 3',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLLDD',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 4',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLLL',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 5',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLLD',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 6',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLDL',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 7',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLDD',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 8',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLL',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 9',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LLD',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 10',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LDL',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 11',
    rows: ['R-29', 'R-44'],
  },
  {
    layout: 'LDD',
    plateTypes: ['individual'],
    source: '§ 30 ust. 2 pkt 4; zał. 12 rys. 12 poz. 12',
    rows: ['R-29', 'R-44'],
  },
];

describe('vehicle-part-templates', () => {
  it('has exactly 57 templates matching the § 30 ust. 2 table with plateTypes and rows', () => {
    const all = [
      ...COLUMN_4_TEMPLATES,
      ...COLUMN_4_5_TEMPLATES[1],
      ...COLUMN_4_5_TEMPLATES[2],
      ...COLUMN_6_TEMPLATES,
    ];

    expect(all).toHaveLength(57);
    expect(all).toEqual(EXPECTED_TEMPLATES);
  });
});
