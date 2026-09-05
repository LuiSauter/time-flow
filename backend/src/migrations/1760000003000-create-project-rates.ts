import { Table, TableForeignKey, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectRates1760000003000 implements MigrationInterface {
  name = 'CreateProjectRates1760000003000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'project_rates',
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
          { name: 'project_id', type: 'uuid' },
          { name: 'hourly_rate', type: 'numeric', precision: 12, scale: 2 },
          { name: 'effective_from', type: 'date' },
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'fk_project_rates_project',
            columnNames: ['project_id'],
            referencedTableName: 'projects',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
        indices: [
          new TableIndex({
            name: 'uq_project_rates_project_effective_from',
            columnNames: ['project_id', 'effective_from'],
            isUnique: true,
          }),
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'project_daily_rate_overrides',
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
          { name: 'project_id', type: 'uuid' },
          { name: 'hourly_rate', type: 'numeric', precision: 12, scale: 2 },
          { name: 'override_date', type: 'date' },
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'fk_project_daily_rate_overrides_project',
            columnNames: ['project_id'],
            referencedTableName: 'projects',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
        indices: [
          new TableIndex({
            name: 'uq_project_daily_rate_overrides_project_date',
            columnNames: ['project_id', 'override_date'],
            isUnique: true,
          }),
        ],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('project_daily_rate_overrides');
    await queryRunner.dropTable('project_rates');
  }
}
