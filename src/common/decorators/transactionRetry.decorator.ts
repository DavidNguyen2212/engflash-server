import { Injectable, Logger } from "@nestjs/common";
import { DataSource, QueryRunner } from "typeorm";
import { MAX_RETRIES, RETRYABLE_ERROR_CODES } from "../constants";

@Injectable()
export class TransactionalRunner {
    private readonly logger = new Logger(TransactionalRunner.name);
    constructor(private readonly dataSource: DataSource) {}

    async runWithRetry<T>(fn: (queryRunner: QueryRunner) => Promise<T>, maxRetries: number = MAX_RETRIES): Promise<T> {
        let attempt: number = 0
        let lastError: any

        while (attempt < maxRetries) {
            const queryRunner = this.dataSource.createQueryRunner()
            await queryRunner.connect()
            await queryRunner.startTransaction()

            try {
                const result = await fn(queryRunner)
                await queryRunner.commitTransaction()
                return result
            } catch (error) {
                await queryRunner.rollbackTransaction()
                lastError = error

                const code = error?.driverError?.code
                const isRetryable = RETRYABLE_ERROR_CODES.includes(code);
                this.logger.warn(
                    `Transaction failed (attempt ${attempt + 1}/${maxRetries}): ${code} ${error.message}`,
                );

                if (!isRetryable) {
                    throw error
                }

                attempt++
            } finally {
                await queryRunner.release()
            }
        }

        throw lastError
    }
}