import { Table } from 'typeorm';
import { CreateProjectRates1760000003000 } from '../migrations/1760000003000-create-project-rates.js';

describe('CreateProjectRates1760000003000 migration', () => {
  it('creates historical rates and daily overrides with project ownership', async () => {
    const createTable = vi.fn();
    const queryRunner = { createTable } as any;
    const migration = new CreateProjectRates1760000003000();

    await migration.up(queryRunner);

    const tables = createTable.mock.calls.map(([table]) => table as Table);
    expect(tables.map((table) => table.name)).toEqual([
      'project_rates',
      'project_daily_rate_overrides',
    ]);
    expect(tables[0]?.columns.map((column) => column.name)).toEqual(
      expect.arrayContaining([
        'id',
        'created_at',
        'updated_at',
        'project_id',
        'hourly_rate',
        'effective_from',
      ]),
    );
    expect(tables[1]?.columns.map((column) => column.name)).toEqual(
      expect.arrayContaining([
        'id',
        'created_at',
        'updated_at',
        'project_id',
        'hourly_rate',
        'override_date',
      ]),
    );
    expect(tables.flatMap((table) => table.foreignKeys)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          referencedTableName: 'projects',
          referencedColumnNames: ['id'],
        }),
        expect.objectContaining({
          referencedTableName: 'projects',
          referencedColumnNames: ['id'],
        }),
      ]),
    );
  });

  it('uses two-decimal rates and unique project dates', async () => {
    const createTable = vi.fn();
    const queryRunner = { createTable } as any;
    const migration = new CreateProjectRates1760000003000();

    await migration.up(queryRunner);

    const tables = createTable.mock.calls.map(([table]) => table as Table);
    expect(tables[0]?.columns.find((column) => column.name === 'hourly_rate')).toMatchObject({
      type: 'numeric',
      precision: 12,
      scale: 2,
    });
    expect(tables[0]?.indices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'uq_project_rates_project_effective_from',
          columnNames: ['project_id', 'effective_from'],
          isUnique: true,
        }),
      ]),
    );
    expect(tables[1]?.indices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'uq_project_daily_rate_overrides_project_date',
          columnNames: ['project_id', 'override_date'],
          isUnique: true,
        }),
      ]),
    );
  });
});
