// import { MigrationInterface, QueryRunner } from "typeorm";

// export class GenerateMigration1750502631288 implements MigrationInterface {
//     public readonly name = 'GenerateMigration1750502631288'

//     public async up(queryRunner: QueryRunner): Promise<void> {
//         await queryRunner.query(`CREATE TYPE "public"."user_card_review_logs_event_type_enum" AS ENUM('learn', 'review')`);
//         await queryRunner.query(`ALTER TABLE "user_card_review_logs" ADD "event_type" "public"."user_card_review_logs_event_type_enum" NOT NULL DEFAULT 'learn'`);
//         await queryRunner.query(`ALTER TABLE "user_card_review_logs" DROP COLUMN "rating"`);
//         await queryRunner.query(`CREATE TYPE "public"."user_card_review_logs_rating_enum" AS ENUM('good', 'again', 'correct', 'wrong')`);
//         await queryRunner.query(`
//             ALTER TABLE "user_card_review_logs"
//             ADD "rating" "public"."user_card_review_logs_rating_enum"
//             NOT NULL DEFAULT 'good'
//           `);
//         await queryRunner.query(`ALTER TABLE "user_card_reviews" ADD CONSTRAINT "UQ_fe5b2c93af4a96c3142da236d75" UNIQUE ("user_id", "card_id")`);
//     }

//     public async down(queryRunner: QueryRunner): Promise<void> {
//         await queryRunner.query(`ALTER TABLE "user_card_reviews" DROP CONSTRAINT "UQ_fe5b2c93af4a96c3142da236d75"`);
//         await queryRunner.query(`ALTER TABLE "user_card_review_logs" DROP COLUMN "rating"`);
//         await queryRunner.query(`DROP TYPE "public"."user_card_review_logs_rating_enum"`);
//         await queryRunner.query(`ALTER TABLE "user_card_review_logs" ADD "rating" character varying(10) NOT NULL`);
//         await queryRunner.query(`ALTER TABLE "user_card_review_logs" DROP COLUMN "event_type"`);
//         await queryRunner.query(`DROP TYPE "public"."user_card_review_logs_event_type_enum"`);
//     }

// }
