import { DataSourceConfig } from './data.source.js';
import { ProjectDailyRateOverride } from '../projects/project-daily-rate-override.entity.js';
import { ProjectRate } from '../projects/project-rate.entity.js';
import { CreateProjectRates1760000003000 } from '../migrations/1760000003000-create-project-rates.js';

describe('DataSourceConfig', () => {
  it('registers rate entities and migration', () => {
    expect(DataSourceConfig.entities).toEqual(
      expect.arrayContaining([ProjectRate, ProjectDailyRateOverride]),
    );
    expect(DataSourceConfig.migrations).toEqual(
      expect.arrayContaining([CreateProjectRates1760000003000]),
    );
  });
});
