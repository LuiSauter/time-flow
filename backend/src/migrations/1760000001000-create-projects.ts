import { Table, TableForeignKey, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjects1760000001000 implements MigrationInterface {
  name = 'CreateProjects1760000001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'projects',
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
          { name: 'name', type: 'varchar' },
          { name: 'time_zone', type: 'varchar' },
          { name: 'daily_goal_minutes', type: 'integer', default: '480' },
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'fk_projects_user',
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
        indices: [
          new TableIndex({
            name: 'idx_projects_user_id',
            columnNames: ['user_id'],
          }),
        ],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('projects');
  }
}
