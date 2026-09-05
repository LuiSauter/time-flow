import { Table } from 'typeorm';
import { CreateTracker1760000002000 } from '../migrations/1760000002000-create-tracker.js';

describe('CreateTracker1760000002000 migration', () => {
  it('creates journeys and segments with ownership and open-record constraints', async () => {
    const createTable = vi.fn();
    const createIndex = vi.fn();
    const queryRunner = { createTable, createIndex } as any;
    const migration = new CreateTracker1760000002000();

    await migration.up(queryRunner);

    const tables = createTable.mock.calls.map(([table]) => table as Table);
    expect(tables.map((table) => table.name)).toEqual([
      'work_sessions',
      'tracker_segments',
    ]);
    expect(tables[0]?.columns.map((column) => column.name)).toEqual(
      expect.arrayContaining([
        'id',
        'user_id',
        'project_id',
        'origin',
        'label',
        'started_at',
        'ended_at',
      ]),
    );
    expect(tables[1]?.columns.map((column) => column.name)).toEqual(
      expect.arrayContaining([
        'id',
        'work_session_id',
        'kind',
        'label',
        'started_at',
        'ended_at',
      ]),
    );
    expect(tables[0]?.foreignKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ referencedTableName: 'users' }),
        expect.objectContaining({ referencedTableName: 'projects' }),
      ]),
    );
    expect(tables[1]?.foreignKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ referencedTableName: 'work_sessions' }),
      ]),
    );

    expect(createIndex).toHaveBeenCalledWith(
      'work_sessions',
      expect.objectContaining({
        name: 'uq_work_sessions_open_per_user_project',
        columnNames: ['user_id', 'project_id'],
        isUnique: true,
        where: '"ended_at" IS NULL',
      }),
    );
    expect(createIndex).toHaveBeenCalledWith(
      'tracker_segments',
      expect.objectContaining({
        name: 'uq_tracker_segments_open_per_session',
        columnNames: ['work_session_id'],
        isUnique: true,
        where: '"ended_at" IS NULL',
      }),
    );
  });
});
