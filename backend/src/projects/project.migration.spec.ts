import { Table } from 'typeorm';
import { CreateProjects1760000001000 } from '../migrations/1760000001000-create-projects.js';

describe('CreateProjects1760000001000 migration', () => {
  it('creates projects with ownership, timezone and daily goal', async () => {
    const createTable = vi.fn();
    const queryRunner = { createTable } as any;
    const migration = new CreateProjects1760000001000();

    await migration.up(queryRunner);

    const table = createTable.mock.calls[0]?.[0] as Table;
    expect(table.name).toBe('projects');
    expect(table.columns.map((column) => column.name)).toEqual(
      expect.arrayContaining([
        'id',
        'created_at',
        'updated_at',
        'user_id',
        'name',
        'time_zone',
        'daily_goal_minutes',
      ]),
    );
    expect(table.columns.find((column) => column.name === 'daily_goal_minutes')).toMatchObject({
      type: 'integer',
      default: '480',
    });
    expect(table.foreignKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
        }),
      ]),
    );
  });
});
