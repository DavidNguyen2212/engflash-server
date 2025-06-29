import { MigrationInterface, QueryRunner } from "typeorm";

export class GenerateMigration1750999147914 implements MigrationInterface {
    public readonly name = 'GenerateMigration1750999147914'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notification_notif_type_enum" AS ENUM('VOCAB_SET_UPDATE', 'NEW_DEFAULT_SET', 'SRS_REVIEW', 'SYSTEM')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_channels_enum" AS ENUM('IN_APP', 'PUSH')`);
        await queryRunner.query(`CREATE TABLE "notification" ("id" SERIAL NOT NULL, "notif_type" "public"."notification_notif_type_enum" NOT NULL, "title" character varying, "content" text NOT NULL, "linkTo" character varying, "data" jsonb, "dueAt" TIMESTAMP WITH TIME ZONE, "deliveredAt" TIMESTAMP WITH TIME ZONE, "readAt" TIMESTAMP WITH TIME ZONE, "channels" "public"."notification_channels_enum" array NOT NULL DEFAULT '{IN_APP,PUSH}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2302b85c01e5449c962e5d419b" ON "notification" ("dueAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_5c8e7bcfd9ac41d7e1012297a8" ON "notification" ("user_id", "readAt") `);
        await queryRunner.query(`CREATE TYPE "public"."notification_recipient_channels_enum" AS ENUM('IN_APP', 'PUSH')`);
        await queryRunner.query(`CREATE TABLE "notification_recipient" ("id" SERIAL NOT NULL, "channels" "public"."notification_recipient_channels_enum" array NOT NULL DEFAULT '{IN_APP,PUSH}', "dueAt" TIMESTAMP WITH TIME ZONE, "deliveredAt" TIMESTAMP WITH TIME ZONE, "readAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "notification_id" integer, "user_id" integer, CONSTRAINT "PK_9830357f52360a126737d498e66" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_79e10ec4c7e83c8257ff1ad41a" ON "notification_recipient" ("dueAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_548638ebcd42b56136f06d0017" ON "notification_recipient" ("user_id", "readAt") `);
        await queryRunner.query(`ALTER TABLE "user_card_review_logs" DROP COLUMN "rating"`);
        await queryRunner.query(`CREATE TYPE "public"."user_card_review_logs_rating_enum" AS ENUM('good', 'again', 'correct', 'wrong')`);
        await queryRunner.query(`ALTER TABLE "user_card_review_logs" ADD "rating" "public"."user_card_review_logs_rating_enum" NOT NULL DEFAULT 'good'`);
        await queryRunner.query(`ALTER TABLE "user_card_reviews" ADD CONSTRAINT "UQ_fe5b2c93af4a96c3142da236d75" UNIQUE ("user_id", "card_id")`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_recipient" ADD CONSTRAINT "FK_f6ebcb1bb7f7f55e33cf8488065" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_recipient" ADD CONSTRAINT "FK_7d7f411e854516f615ba846c6a4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification_recipient" DROP CONSTRAINT "FK_7d7f411e854516f615ba846c6a4"`);
        await queryRunner.query(`ALTER TABLE "notification_recipient" DROP CONSTRAINT "FK_f6ebcb1bb7f7f55e33cf8488065"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8"`);
        await queryRunner.query(`ALTER TABLE "user_card_reviews" DROP CONSTRAINT "UQ_fe5b2c93af4a96c3142da236d75"`);
        await queryRunner.query(`ALTER TABLE "user_card_review_logs" DROP COLUMN "rating"`);
        await queryRunner.query(`DROP TYPE "public"."user_card_review_logs_rating_enum"`);
        await queryRunner.query(`ALTER TABLE "user_card_review_logs" ADD "rating" character varying(10) NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_548638ebcd42b56136f06d0017"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_79e10ec4c7e83c8257ff1ad41a"`);
        await queryRunner.query(`DROP TABLE "notification_recipient"`);
        await queryRunner.query(`DROP TYPE "public"."notification_recipient_channels_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5c8e7bcfd9ac41d7e1012297a8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2302b85c01e5449c962e5d419b"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TYPE "public"."notification_channels_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_notif_type_enum"`);
    }

}
