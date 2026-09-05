import { Table, TableForeignKey, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTracker1760000002000 implements MigrationInterface {
  name = 'CreateTracker1760000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'work_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          { name: 'user_id', type: 'uuid' },
          { name: 'project_id', type: 'uuid' },
          { name: 'origin', type: 'varchar' },
          { name: 'label', type: 'varchar' },
          { name: 'started_at', type: 'timestamp with time zone' },
          { name: 'ended_at', type: 'timestamp with time zone', isNullable: true },
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'fk_work_sessions_user',
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            name: 'fk_work_sessions_project',
            columnNames: ['project_id'],
            referencedTableName: 'projects',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
        indices: [
          new TableIndex({
            name: 'idx_work_sessions_project_started_at',
            columnNames: ['project_id', 'started_at'],
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'tracker_segments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          { name: 'work_session_id', type: 'uuid' },
          { name: 'kind', type: 'varchar' },
          { name: 'label', type: 'varchar' },
          { name: 'started_at', type: 'timestamp with time zone' },
          { name: 'ended_at', type: 'timestamp with time zone', isNullable: true },
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'fk_tracker_segments_work_session',
            columnNames: ['work_session_id'],
            referencedTableName: 'work_sessions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
        indices: [
          new TableIndex({
            name: 'idx_tracker_segments_session_started_at',
            columnNames: ['work_session_id', 'started_at'],
          }),
        ],
      }),
    );

    await queryRunner.createIndex(
      'work_sessions',
      new TableIndex({
        name: 'uq_work_sessions_open_per_user_project',
        columnNames: ['user_id', 'project_id'],
        isUnique: true,
        where: '"ended_at" IS NULL',
      }),
    );
    await queryRunner.createIndex(
      'tracker_segments',
      new TableIndex({
        name: 'uq_tracker_segments_open_per_session',
        columnNames: ['work_session_id'],
        isUnique: true,
        where: '"ended_at" IS NULL',
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tracker_segments');
    await queryRunner.dropTable('work_sessions');
  }
}
