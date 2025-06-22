# Sử dụng TransactionalRunner trong Producer-Consumer Architecture

## Tổng quan

`TransactionalRunner` là một utility class mạnh mẽ để quản lý database transactions với retry mechanism, đặc biệt hữu ích trong môi trường producer-consumer với RabbitMQ.

## Cách sử dụng trong QueueService

### 1. Cách 1: Sử dụng TransactionalRunner trực tiếp (Recommended)

```typescript
@Injectable()
export class QueueService {
  private readonly transactionalRunner: TransactionalRunner;

  constructor(
    private readonly dataSource: DataSource,
    // ... other dependencies
  ) { 
    this.transactionalRunner = new TransactionalRunner(dataSource);
  }

  async resolveCardReviewCreated(data: any) {
    return this.transactionalRunner.runWithRetry(
      async (queryRunner: QueryRunner) => {
        // Business logic here
        await queryRunner.manager.save(/* ... */);
        return result;
      },
      3, // maxRetries
      30000 // timeout 30 seconds
    );
  }
}
```

### 2. Cách 2: Sử dụng @Transactional decorator

```typescript
@Injectable()
export class QueueService {
  // Cần inject TransactionalRunner
  constructor(
    private readonly dataSource: DataSource,
  ) { 
    this.transactionalRunner = new TransactionalRunner(dataSource);
  }

  @Transactional(3, 30000)
  async resolveCardReviewCreatedWithDecorator(queryRunner: QueryRunner, data: any) {
    // Business logic here
    // queryRunner được inject tự động
  }
}
```

## Lợi ích của TransactionalRunner

### 1. **Automatic Retry Logic**
```typescript
// Tự động retry cho các lỗi có thể retry được
const RETRYABLE_ERROR_CODES = ['40001', '40P01']; // serialization_failure, deadlock
```

### 2. **Exponential Backoff với Jitter**
```typescript
// Delay = 2^attempt * base_delay + random_jitter
// Cap at 5 seconds maximum
```

### 3. **Timeout Protection**
```typescript
// Transaction timeout sau 30 seconds (configurable)
// Tránh deadlock và hanging transactions
```

### 4. **Comprehensive Logging**
```typescript
// Log chi tiết cho mỗi attempt
// Error tracking và performance monitoring
```

## Integration với RabbitMQ Consumer

### Error Handling Flow

```
┌─────────────────┐    Success    ┌─────────────────┐
│   RabbitMQ      │ ──────────► │   Consumer      │
│   Message       │              │                 │
└─────────────────┘              └─────────────────┘
         │                                │
         │                                ▼
         │                        ┌─────────────────┐
         │                        │ Transactional   │
         │                        │ Runner          │
         │                        └─────────────────┘
         │                                │
         │                                ▼
         │                        ┌─────────────────┐
         │                        │ Business Logic  │
         │                        │ (QueueService)  │
         │                        └─────────────────┘
         │                                │
         │                                ▼
         │                        ┌─────────────────┐
         │                        │ Success/Failure │
         │                        └─────────────────┘
         │                                │
         ▼                                ▼
┌─────────────────┐              ┌─────────────────┐
│   ACK Message   │              │   NACK Message  │
│   (Success)     │              │   (Retry/DLQ)   │
└─────────────────┘              └─────────────────┘
```

### Retry Strategy

1. **Attempt 1**: Immediate retry
2. **Attempt 2**: 200ms delay + jitter
3. **Attempt 3**: 400ms delay + jitter
4. **Max retries reached**: Move to Dead Letter Queue

## Configuration Options

### 1. Retryable Error Codes
```typescript
// src/common/constants/pg.enum.ts
export const RETRYABLE_ERROR_CODES = ['40001', '40P01'];
// 40001: serialization_failure
// 40P01: deadlock_detected
```

### 2. Retry Limits
```typescript
export const MAX_RETRIES = 3;
```

### 3. Timeout Settings
```typescript
private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
private readonly BASE_DELAY = 100; // 100ms base delay
```

## Best Practices

### 1. **Idempotency**
```typescript
// Đảm bảo business logic có thể chạy nhiều lần an toàn
async (queryRunner: QueryRunner) => {
  // Check if already processed
  const existing = await queryRunner.manager.findOne(/* ... */);
  if (existing) return existing;
  
  // Process normally
  return await queryRunner.manager.save(/* ... */);
}
```

### 2. **Error Classification**
```typescript
// Chỉ retry cho các lỗi transient
const isRetryable = RETRYABLE_ERROR_CODES.includes(error?.driverError?.code);
if (!isRetryable) {
  throw error; // Don't retry for permanent errors
}
```

### 3. **Monitoring**
```typescript
// Log performance metrics
const startTime = Date.now();
const result = await this.transactionalRunner.runWithRetry(/* ... */);
const duration = Date.now() - startTime;
this.logger.log(`Transaction completed in ${duration}ms`);
```

## Comparison với Manual Transaction Management

### ❌ Manual Approach (Error-prone)
```typescript
async manualTransaction() {
  const queryRunner = this.dataSource.createQueryRunner();
  try {
    await queryRunner.startTransaction();
    // Business logic
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error; // No retry logic
  } finally {
    await queryRunner.release();
  }
}
```

### ✅ TransactionalRunner Approach (Robust)
```typescript
async robustTransaction() {
  return this.transactionalRunner.runWithRetry(
    async (queryRunner: QueryRunner) => {
      // Business logic
      return result;
    },
    3, // Automatic retry
    30000 // Timeout protection
  );
}
```

## Production Considerations

### 1. **Monitoring**
- Track retry counts
- Monitor transaction duration
- Alert on high failure rates

### 2. **Dead Letter Queue**
- Failed messages after max retries
- Manual intervention capability
- Audit trail

### 3. **Performance**
- Connection pooling
- Query optimization
- Index management

### 4. **Security**
- SQL injection prevention
- Input validation
- Access control

## Kết luận

`TransactionalRunner` cung cấp một giải pháp robust cho việc quản lý transactions trong môi trường producer-consumer:

- ✅ **Automatic retry** cho transient errors
- ✅ **Timeout protection** tránh hanging transactions  
- ✅ **Exponential backoff** giảm database load
- ✅ **Comprehensive logging** cho monitoring
- ✅ **Easy integration** với existing code

Đây là một pattern rất phù hợp cho các hệ thống cần high availability và data consistency. 