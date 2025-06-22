import { Injectable, Logger } from "@nestjs/common";
import { DataSource, QueryRunner } from "typeorm";
import { MAX_RETRIES, RETRYABLE_ERROR_CODES } from "../constants";

@Injectable()
export class TransactionalRunner {
    private readonly logger = new Logger(TransactionalRunner.name);
    private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
    private readonly BASE_DELAY = 100; // 100ms base delay

    constructor(private readonly dataSource: DataSource) {}

    async runWithRetry<T>(
        fn: (queryRunner: QueryRunner) => Promise<T>, 
        maxRetries: number = MAX_RETRIES,
        timeout: number = this.DEFAULT_TIMEOUT
    ): Promise<T> {
        // Validate parameters
        if (maxRetries < 0 || maxRetries > 10) {
            throw new Error('maxRetries must be between 0 and 10');
        }
        if (timeout < 1000 || timeout > 300000) {
            throw new Error('timeout must be between 1 and 300 seconds');
        }

        let attempt: number = 0;
        let lastError: any;

        while (attempt <= maxRetries) {
            const queryRunner = this.dataSource.createQueryRunner();
            let timeoutId: NodeJS.Timeout | undefined;

            try {
                await queryRunner.connect();
                await queryRunner.startTransaction();

                // Set timeout for transaction
                const timeoutPromise = new Promise<never>((_, reject) => {
                    timeoutId = setTimeout(() => {
                        reject(new Error(`Transaction timeout after ${timeout}ms`));
                    }, timeout);
                });

                // Execute transaction with timeout
                const result = await Promise.race([
                    fn(queryRunner),
                    timeoutPromise
                ]);

                if (timeoutId) clearTimeout(timeoutId);
                await queryRunner.commitTransaction();
                
                if (attempt > 0) {
                    this.logger.log(`Transaction succeeded after ${attempt} retries`);
                }
                
                return result;
            } catch (error) {
                if (timeoutId) clearTimeout(timeoutId);
                await queryRunner.rollbackTransaction();
                lastError = error;

                const code = error?.driverError?.code;
                const isRetryable = RETRYABLE_ERROR_CODES.includes(code);
                
                this.logger.warn(
                    `Transaction failed (attempt ${attempt + 1}/${maxRetries + 1}): ${code || 'UNKNOWN'} ${error.message}`,
                    { 
                        context: 'TransactionalRunner', 
                        errorCode: code,
                        isRetryable,
                        attempt: attempt + 1
                    }
                );

                if (!isRetryable || attempt === maxRetries) {
                    throw error;
                }

                // Exponential backoff with jitter
                const delay = this.calculateBackoffDelay(attempt);
                this.logger.log(`Retrying in ${delay}ms...`);
                await this.sleep(delay);
                attempt++;
            } finally {
                await queryRunner.release();
            }
        }

        throw lastError;
    }

    private calculateBackoffDelay(attempt: number): number {
        // Exponential backoff: 2^attempt * base_delay + random jitter
        const exponentialDelay = Math.pow(2, attempt) * this.BASE_DELAY;
        const jitter = Math.random() * 100; // 0-100ms random jitter
        return Math.min(exponentialDelay + jitter, 5000); // Cap at 5 seconds
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Decorator for easy usage
export function Transactional(maxRetries?: number, timeout?: number) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            // Get TransactionalRunner from the class instance
            const transactionalRunner = (this as any).transactionalRunner;
            
            if (!transactionalRunner) {
                throw new Error('TransactionalRunner not found. Make sure to inject it in the constructor.');
            }

            return transactionalRunner.runWithRetry(
                async (queryRunner: QueryRunner) => {
                    // Pass queryRunner as the first argument to the method
                    return originalMethod.apply(this, [queryRunner, ...args]);
                },
                maxRetries,
                timeout
            );
        };

        return descriptor;
    };
}