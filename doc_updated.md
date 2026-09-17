# Kiến trúc công nghệ - Đồ án Website Khóa học Online

## Mục tiêu

Ưu tiên hoàn thành sản phẩm trong khoảng **3 tháng** (khoảng 1
giờ/ngày), tập trung vào Backend để phục vụ đồ án và portfolio.

------------------------------------------------------------------------

# Frontend

  Công nghệ      Chọn              Lý do
  -------------- ----------------- -------------------
  Framework      React             Đã có kinh nghiệm
  Language       JavaScript        Tập trung tiến độ
  Build Tool     Vite              Nhanh
  UI             Ant Design        Quen sử dụng
  Routing        React Router      Chuẩn SPA
  API            Axios             Phổ biến
  Server State   TanStack Query    Cache dữ liệu
  Form           React Hook Form   Hiệu năng
  Validation     Zod               Validate form
  Rich Text      Tiptap            Soạn bài học
  Chart          Recharts          Dashboard

# Backend

  Công nghệ        Chọn                  Lý do
  ---------------- --------------------- ----------------------------------------
  Framework        **Express.js**        Đơn giản, học nhanh, phù hợp thời gian
  Language         **TypeScript**        Dễ bảo trì, phù hợp tuyển dụng
  ORM              Prisma ORM            AI hỗ trợ tốt, tài liệu nhiều
  Database         PostgreSQL            Phù hợp LMS
  Authentication   JWT + Refresh Token   Chuẩn hiện nay
  API Docs         Swagger               Sinh tài liệu API

> Không chọn NestJS ở giai đoạn này vì thời gian hạn chế. Khi đã thành
> thạo Express + TypeScript có thể chuyển sang NestJS khá dễ.

# Database

-   PostgreSQL
-   Hosting: Neon

# Storage

-   Cloudflare R2
-   Chỉ lưu URL trong database:
    -   video_url
    -   thumbnail_url
    -   pdf_url
    -   image_url

# Hạ tầng

-   Docker
-   Docker Compose
-   Git + GitHub
-   GitHub Actions

# Deploy

  Thành phần   Dịch vụ
  ------------ ---------------
  Frontend     Vercel
  Backend      VPS + Docker
  Database     Neon
  Storage      Cloudflare R2

# Tính năng MVP

-   Đăng ký / Đăng nhập
-   JWT + Refresh Token
-   Phân quyền Admin / Teacher / Student
-   CRUD khóa học
-   CRUD chương học
-   CRUD bài học
-   Upload video
-   Upload PDF
-   Quiz
-   Theo dõi tiến độ học
-   Dashboard
-   Tìm kiếm khóa học

# Có thể mở rộng

-   Thanh toán
-   Bình luận
-   Đánh giá khóa học
-   Thống kê nâng cao
