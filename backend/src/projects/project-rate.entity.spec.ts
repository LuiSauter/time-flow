import { getMetadataArgsStorage } from 'typeorm';
import { Project } from './project.entity.js';
import { ProjectRate } from './project-rate.entity.js';

describe('ProjectRate entity', () => {
  it('declares the historical rate fields', () => {
    const columns = getMetadataArgsStorage().columns
      .filter((column) => column.target === ProjectRate)
      .map((column) => column.propertyName);

    expect(columns).toEqual(expect.arrayContaining(['hourlyRate', 'effectiveFrom']));
  });

  it('stores the rate with two decimal places and a local effective date', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      (column) => column.target === ProjectRate,
    );
    const rateColumn = columns.find((column) => column.propertyName === 'hourlyRate');
    const dateColumn = columns.find((column) => column.propertyName === 'effectiveFrom');

    expect(rateColumn?.options).toMatchObject({
      name: 'hourly_rate',
      type: 'numeric',
      precision: 12,
      scale: 2,
    });
    expect(dateColumn?.options).toMatchObject({ name: 'effective_from', type: 'date' });
  });

  it('belongs to a project with cascading deletion', () => {
    const relation = getMetadataArgsStorage().relations.find(
      (item) => item.target === ProjectRate && item.propertyName === 'project',
    );

    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.type()).toBe(Project);
    expect(relation?.options).toMatchObject({ nullable: false, onDelete: 'CASCADE' });
  });
});
