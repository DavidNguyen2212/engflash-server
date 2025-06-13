# EngFlash 🧠

<!-- VERSION BADGE -->
![version](https://img.shields.io/github/package-json/v/DavidNguyen2212/engflash-server?label=version)

<!-- RELEASE BADGE -->
[![release](https://img.shields.io/github/v/release/DavidNguyen2212/engflash-server?label=release)](https://github.com/DavidNguyen2212/engflash-server/releases)

<p align="center">
  <a href="https://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="100" alt="NestJS logo" />
  </a>
</p>

<p align="center">
  EngFlash là ứng dụng web giúp bạn học từ vựng tiếng Anh hiệu quả bằng flashcards, hệ thống nhắc lại giãn cách (spaced repetition), theo dõi streak và review từ dễ đến khó.
</p>

---

## 🚀 Tính năng chính

- ✅ Học từ vựng qua flashcard (front/back)
- ⏱ Nhắc lại theo **Spaced Repetition**
- 📊 Theo dõi tiến độ, thống kê tuần/tháng
- 🧠 Hệ thống **streak học tập**
- 🔍 Bộ lọc review tùy chỉnh (dễ → khó, theo chủ đề,...)

---

## 🛠 Cài đặt & phát triển

```bash
# Cài đặt
yarn install

# Khởi chạy chế độ dev
yarn start:dev

# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## CI/CD
- Tự động release qua semantic-release

- Deploy backend lên Render.com

- Badge version & release cập nhật tự động mỗi lần merge

## Technologies
- NestJS – Backend framework

- TypeScript – Ngôn ngữ chính

- PostgreSQL – Lưu trữ dữ liệu

- Redis – Cache và quản lý session

- RabbitMQ – Giao tiếp bất đồng bộ (event queue)

- Swagger – API documentation

## License

EngFlash is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
