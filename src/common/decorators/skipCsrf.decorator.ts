// csrf.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const CSRF_SKIP_KEY = 'csrf_skip';

// Decorator to skip CSRF protection
// SetMetadata(key, value) là hàm để set metadata mà Reflector sẽ đọc được trong Guard.

// CSRF_SKIP() khi dùng sẽ đánh dấu route handler là "bỏ qua kiểm tra CSRF".
export const CSRF_SKIP = () => SetMetadata(CSRF_SKIP_KEY, true);
