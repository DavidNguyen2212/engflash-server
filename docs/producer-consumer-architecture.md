# Producer-Consumer Architecture với RabbitMQ

## Tổng quan kiến trúc

Kiến trúc hiện tại của bạn đã tuân thủ các nguyên tắc cơ bản của producer-consumer pattern:

```
┌─────────────────┐    Event    ┌─────────────────┐    Process    ┌─────────────────┐
│   CardsService  │ ──────────► │ CardReview      │ ──────────► │   QueueService  │
│   (Producer)    │             │ Consumer        │             │   (Business     │
│                 │             │                 │             │    Logic)       │
└─────────────────┘             └─────────────────┘             └─────────────────┘
```

## ✅ Điểm mạnh của kiến trúc hiện tại

1. **Tách biệt trách nhiệm**: Producer chỉ lo emit event, Consumer xử lý logic phức tạp
2. **Asynchronous processing**: Không block main thread khi gọi AI
3. **Event-driven**: Sử dụng event pattern phù hợp
4. **Modular design**: QueueModule được import đúng cách

## ⚠️ Vấn đề và giải pháp

### 1. Vấn đề về Transaction và Rollback

**Vấn đề:**
- Transaction trong `swipeCard()` và consumer hoàn toàn độc lập
- Nếu consumer fail, dữ liệu trong `swipeCard()` đã được commit
- Không có cơ chế rollback cross-service

**Giải pháp đã implement:**
- Sử dụng transaction trong QueueService
- Implement retry mechanism với Dead Letter Queue
- Proper error handling và logging

### 2. Cơ chế Retry và Dead Letter Queue

```typescript
// Retry logic trong consumer
if (retryCount < 3) {
  channel.nack(originalMsg, false, true); // requeue = true
} else {
  channel.nack(originalMsg, false, false); // requeue = false (DLQ)
}
```

### 3. Transaction Management

```typescript
// Trong QueueService
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.startTransaction();

try {
  // Business logic
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

## 🔧 Cấu hình RabbitMQ

### Dead Letter Queue Configuration

```typescript
queueOptions: {
  durable: true,
  arguments: {
    'x-dead-letter-exchange': '',
    'x-dead-letter-routing-key': 'card_review_dlq',
    'x-message-ttl': 30000, // 30 seconds TTL
  },
},
prefetchCount: 1, // Process one message at a time
```

## 📋 Best Practices đã áp dụng

### 1. Error Handling
- Proper try-catch blocks
- Transaction rollback on error
- Comprehensive logging

### 2. Message Acknowledgment
- Manual acknowledgment (ack/nack)
- Retry mechanism với giới hạn
- Dead letter queue cho failed messages

### 3. Monitoring và Logging
- Structured logging với emoji
- Error tracking
- Performance monitoring

### 4. Transaction Management
- Explicit transaction control
- Proper cleanup với finally block
- Data consistency guarantee

## 🚀 Cải thiện đề xuất

### 1. Monitoring và Alerting
```typescript
// Thêm metrics collection
@Injectable()
export class MetricsService {
  recordEventProcessing(duration: number, success: boolean) {
    // Send to monitoring service
  }
}
```

### 2. Circuit Breaker Pattern
```typescript
// Cho OpenAI calls
@Injectable()
export class CircuitBreakerService {
  async callOpenAI(fallback: () => Promise<any>) {
    // Implement circuit breaker logic
  }
}
```

### 3. Message Schema Validation
```typescript
// Validate message structure
@EventPattern('card.review.created')
async receiveCardReviewCreated(
  @Payload() data: CardReviewCreatedEvent, // Use DTO instead of any
  @Ctx() context: RmqContext,
) {
  // Validation will be automatic
}
```

### 4. Health Checks
```typescript
// Add health check for queue
@Injectable()
export class QueueHealthIndicator {
  async isHealthy(): Promise<HealthIndicatorResult> {
    // Check RabbitMQ connection and queue status
  }
}
```

## 🔄 Rollback Strategy

### 1. Saga Pattern (cho distributed transactions)
```typescript
// Implement compensation actions
async compensateCardReview(data: any) {
  // Rollback logic for failed operations
  await this.reviewLogRepository.delete({ /* criteria */ });
  await this.choiceRepository.delete({ /* criteria */ });
}
```

### 2. Outbox Pattern
```typescript
// Store events in database first
async swipeCard(userId: number, data: ReviewCardDTO) {
  // 1. Save to database
  // 2. Save event to outbox table
  // 3. Background job processes outbox
}
```

## 📊 Monitoring Checklist

- [ ] Message processing rate
- [ ] Error rate và retry count
- [ ] Queue depth
- [ ] Processing time
- [ ] Dead letter queue size
- [ ] Database transaction success rate

## 🎯 Kết luận

Kiến trúc của bạn đã khá tốt và tuân thủ các nguyên tắc cơ bản. Các cải thiện đã implement sẽ giúp:

1. **Reliability**: Retry mechanism và DLQ
2. **Observability**: Comprehensive logging
3. **Data consistency**: Transaction management
4. **Error recovery**: Proper error handling

Để production-ready, cần thêm:
- Monitoring và alerting
- Circuit breaker cho external services
- Message schema validation
- Health checks 