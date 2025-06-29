export class SendCodeEvent {
    constructor(
      public readonly email: string,
      public readonly code: string
    ) {}
  }