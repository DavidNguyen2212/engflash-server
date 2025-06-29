import { MigrationInterface, QueryRunner } from "typeorm";

export class GenerateMigration1751173323683 implements MigrationInterface {
    name = 'GenerateMigration1751173323683'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5c8e7bcfd9ac41d7e1012297a8"`);
        await queryRunner.query(`CREATE TABLE "device" ("id" SERIAL NOT NULL, "fcm_token" character varying NOT NULL, "platform" character varying NOT NULL DEFAULT 'unknown', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_2dc10972aa4e27c01378dad2c72" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "readAt"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "user_id"`);
        await queryRunner.query(`CREATE TYPE "public"."user_card_review_logs_event_type_enum" AS ENUM('learn', 'review')`);
        await queryRunner.query(`ALTER TABLE "user_card_review_logs" ADD "event_type" "public"."user_card_review_logs_event_type_enum" NOT NULL DEFAULT 'learn'`);
        await queryRunner.query(`ALTER TABLE "user_card_review_logs" ALTER COLUMN "rating" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "isActive" SET DEFAULT true`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9ef3a98d26422be6d6e74492d1" ON "notification_recipient" ("notification_id", "user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7d7f411e854516f615ba846c6a" ON "notification_recipient" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d37dff9ec6eb074cc4d76e1e55" ON "notification" ("notif_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_648e3f5447f725579d7d4ffdfb" ON "roles" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_409a0298fdd86a6495e23c25c6" ON "users" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_261d4e40869089b7b0cc3b29b9" ON "users" ("lastLogin") `);
        await queryRunner.query(`ALTER TABLE "device" ADD CONSTRAINT "FK_9eb58b0b777dbc2864820228ebc" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "device" DROP CONSTRAINT "FK_9eb58b0b777dbc2864820228ebc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_261d4e40869089b7b0cc3b29b9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_409a0298fdd86a6495e23c25c6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_648e3f5447f725579d7d4ffdfb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d37dff9ec6eb074cc4d76e1e55"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d7f411e854516f615ba846c6a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9ef3a98d26422be6d6e74492d1"`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "isActive" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_card_review_logs" ALTER COLUMN "rating" SET DEFAULT 'good'`);
        await queryRunner.query(`ALTER TABLE "user_card_review_logs" DROP COLUMN "event_type"`);
        await queryRunner.query(`DROP TYPE "public"."user_card_review_logs_event_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "user_id" integer`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "readAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`DROP TABLE "device"`);
        await queryRunner.query(`CREATE INDEX "IDX_5c8e7bcfd9ac41d7e1012297a8" ON "notification" ("readAt", "user_id") `);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
