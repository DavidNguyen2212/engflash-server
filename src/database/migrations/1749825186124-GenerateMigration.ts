import { MigrationInterface, QueryRunner } from 'typeorm';

export class GenerateMigration1749825186124 implements MigrationInterface {
  public readonly name = 'GenerateMigration1749825186124';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "health"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "health" character varying`,
    );
  }
}
