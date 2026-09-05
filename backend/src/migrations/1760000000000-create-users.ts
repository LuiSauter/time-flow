import { Table } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1760000000000 implements MigrationInterface {
  name = 'CreateUsers1760000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
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
          { name: 'full_name', type: 'varchar' },
          { name: 'email', type: 'varchar', isUnique: true },
          { name: 'password_hash', type: 'varchar' },
        ],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
