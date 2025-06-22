export class CardReviewCreatedEvent {
    constructor(
      public readonly userId: number,
      public readonly cardId: number,
      public readonly reviewId: number,
      public readonly isFirstReview: boolean,
      public readonly cardFrontText: string,
      public readonly cardBackText: string,
      public readonly rating: string,
      public readonly eventType: string,
      public readonly reviewedAt: Date,
    ) {}
  }