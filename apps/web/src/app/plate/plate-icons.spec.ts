import {
  ApartmentOutline as PackageApartmentOutline,
  BankOutline as PackageBankOutline,
  CarOutline as PackageCarOutline,
  EnvironmentOutline as PackageEnvironmentOutline,
  GlobalOutline as PackageGlobalOutline,
  InfoCircleOutline as PackageInfoCircleOutline,
  UnorderedListOutline as PackageUnorderedListOutline,
} from '@ant-design/icons-angular/icons';

import {
  ApartmentOutline,
  BankOutline,
  CarOutline,
  EnvironmentOutline,
  GlobalOutline,
  InfoCircleOutline,
  UnorderedListOutline,
} from './plate-icons';

const LOCAL_ICONS = [
  ['ApartmentOutline', ApartmentOutline, PackageApartmentOutline],
  ['BankOutline', BankOutline, PackageBankOutline],
  ['CarOutline', CarOutline, PackageCarOutline],
  ['EnvironmentOutline', EnvironmentOutline, PackageEnvironmentOutline],
  ['GlobalOutline', GlobalOutline, PackageGlobalOutline],
  ['InfoCircleOutline', InfoCircleOutline, PackageInfoCircleOutline],
  ['UnorderedListOutline', UnorderedListOutline, PackageUnorderedListOutline],
] as const;

describe('plate-icons', () => {
  it('lists the seven local icons by name', () => {
    expect(LOCAL_ICONS.map(([name]) => name)).toEqual([
      'ApartmentOutline',
      'BankOutline',
      'CarOutline',
      'EnvironmentOutline',
      'GlobalOutline',
      'InfoCircleOutline',
      'UnorderedListOutline',
    ]);
  });

  it.each(LOCAL_ICONS)(
    '%s matches the package IconDefinition',
    (_name, local, fromPackage) => {
      expect(local.name).toBe(fromPackage.name);
      expect(local.theme).toBe(fromPackage.theme);
      expect(local.icon).toBe(fromPackage.icon);
    },
  );
});
