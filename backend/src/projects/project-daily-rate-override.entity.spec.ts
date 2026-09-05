import { getMetadataArgsStorage } from 'typeorm';
import { Project } from './project.entity.js';
import { ProjectDailyRateOverride } from './project-daily-rate-override.entity.js';

describe('ProjectDailyRateOverride entity', () => {
  it('declares the daily override fields', () => {
    const columns = getMetadataArgsStorage().columns
      .filter((column) => column.target === ProjectDailyRateOverride)
      .map((column) => column.propertyName);

    expect(columns).toEqual(expect.arrayContaining(['hourlyRate', 'overrideDate']));
  });

  it('stores the override rate with two decimal places and a date', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      (column) => column.target === ProjectDailyRateOverride,
    );
    const rateColumn = columns.find((column) => column.propertyName === 'hourlyRate');
    const dateColumn = columns.find((column) => column.propertyName === 'overrideDate');

    expect(rateColumn?.options).toMatchObject({
      name: 'hourly_rate',
      type: 'numeric',
      precision: 12,
      scale: 2,
    });
    expect(dateColumn?.options).toMatchObject({ name: 'override_date', type: 'date' });
  });

  it('belongs to a project with cascading deletion', () => {
    const relation = getMetadataArgsStorage().relations.find(
      (item) =>
        item.target === ProjectDailyRateOverride && item.propertyName === 'project',
    );

    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.type()).toBe(Project);
    expect(relation?.options).toMatchObject({ nullable: false, onDelete: 'CASCADE' });
  });
});
