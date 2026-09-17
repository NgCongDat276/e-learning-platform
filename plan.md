# 🚀 Kế Hoạch Phát Triển Fullstack LMS (Modular Architecture)

Tài liệu thiết kế kiến trúc và kế hoạch triển khai chi tiết cho **Hệ Thống Website Khóa Học Online (LMS)**. Dự án được phát triển theo mô hình **Modular Architecture (Feature-based)** kết hợp với chiến lược **Full-stack Vertical Slice** (Hoàn thiện dứt điểm từng Module từ Backend API đến Frontend UI).

---

## 🏗️ 1. Cấu Trúc Tổng Thể Dự Án (Project Structure)

### 1.1 Backend (`backend/src/`) - Express + TypeScript + Prisma
```text
backend/src/
├── config/                     # Cấu hình môi trường (env, cors, constants)
│   ├── env.config.ts
│   └── constants.ts
│
├── common/                     # Hạ tầng & tiện ích dùng chung
│   ├── database/               # Prisma client singleton
│   │   └── prisma.ts
│   ├── errors/                 # Custom AppError classes
│   │   ├── app-error.ts
│   │   └── http-status.ts
│   ├── middlewares/            # Middlewares hệ thống
│   │   ├── authenticate.ts     # Verify JWT Access Token
│   │   ├── authorize.ts        # RBAC Check (ADMIN, LECTURER, STUDENT)
│   │   ├── error-handler.ts    # Global Error Handler
│   │   └── validate.ts         # Zod Request Validation
│   └── utils/                  # Utility functions
│       ├── api-response.ts     # Standardized JSON Format
│       ├── password.util.ts    # Hash/compare password
│       └── jwt.util.ts         # Sign & verify JWT
│
├── modules/                    # Tất cả các tính năng nghiệp vụ độc lập
│   ├── auth/                   # Module Đăng ký, Đăng nhập, Token
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.schema.ts
│   │   └── auth.types.ts
│   ├── users/                  # Module Hồ sơ & Quản lý người dùng
│   ├── courses/                # Module Quản lý khóa học
│   ├── chapters/               # Module Chương học
│   ├── lessons/                # Module Bài học
│   ├── upload/                 # Module Cloudflare R2 Media Upload
│   ├── enrollments/            # Module Đăng ký học & Tiến độ
│   ├── quizzes/                # Module Ngân hàng câu hỏi & Bài làm test
│   ├── comments/               # Module Thảo luận / Bình luận bài học
│   └── analytics/              # Module Dashboard & Thống kê
│
├── routes.ts                   # Central Express Router
├── app.ts                      # Cấu hình Express app & Swagger
└── index.ts                    # Entry point server
```

### 1.2 Frontend (`frontend/src/`) - React + TypeScript + Vite + Ant Design
```text
frontend/src/
├── api/                        # Axios instance & API services
│   ├── axios-client.ts         # Base Axios với auto Bearer token & refresh token
│   ├── auth.api.ts
│   ├── courses.api.ts
│   └── ...
│
├── components/                 # React UI Components dùng chung
│   ├── common/                 # Loading, EmptyState, Header, Sidebar
│   └── guards/                 # ProtectedRoute (AuthGuard, RoleGuard)
│
├── context/                    # React Context (AuthContext, ThemeContext)
│   └── AuthContext.tsx
│
├── layouts/                    # Khung Giao Diện
│   ├── AuthLayout.tsx          # Layout trang Đăng nhập / Đăng ký
│   ├── MainLayout.tsx          # Layout chính (Header + Sidebar + Content)
│   └── LearningLayout.tsx      # Layout chế độ tập trung xem bài học
│
├── pages/                      # Tất cả các trang giao diện
│   ├── auth/                   # LoginPage, RegisterPage
│   ├── user/                   # ProfilePage, ChangePasswordPage
│   ├── teacher/                # CourseListPage, CourseCreatePage, LessonBuilderPage
│   ├── student/                # CourseCatalogPage, CourseDetailPage, LearningPage
│   └── admin/                  # UserManagementPage, DashboardPage
│
├── routes/                     # React Router Setup (AppRoutes.tsx)
├── types/                      # TypeScript interfaces & types
└── App.tsx
```

---

## 🎯 2. Lộ Trình Triển Khai Chi Tiết Từng Module (Vertical Slice Roadmap)

---

### 📌 Giai Đoạn 0: Dựng Khung Nền Móng Hạ Tầng (Core Infrastructure Base)

> **Mục tiêu**: Xây dựng xong hệ thống xử lý lỗi, định dạng API chuẩn ở Backend và Axios Client + React Router + Ant Design Base ở Frontend.

#### 🔧 Backend Task (Base)
1. **`src/common/errors/app-error.ts`**:
   - Tạo class `AppError` kế thừa `Error`, hỗ trợ `statusCode`, `message`, `errorsDetails`.
   - Các class con: `BadRequestError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404).
2. **`src/common/utils/api-response.ts`**:
   - Định dạng JSON Response đồng nhất:
     ```json
     {
       "success": true,
       "message": "Thao tác thành công",
       "data": {},
       "pagination": { "page": 1, "limit": 10, "total": 100 }
     }
     ```
3. **`src/common/middlewares/error-handler.ts`**:
   - Bắt mọi lỗi từ Controller, Prisma (`PrismaClientKnownRequestError`) và Zod (`ZodError`).
4. **`src/common/middlewares/validate.ts`**:
   - Middleware nhận Zod Schema để validate `req.body`, `req.query`, `req.params`.

#### 🎨 Frontend Task (Base)
1. **`src/api/axios-client.ts`**:
   - Khởi tạo Axios client (`baseURL: http://localhost:5000/api/v1`).
   - Request Interceptor: Tự động đính kèm `Authorization: Bearer <accessToken>`.
   - Response Interceptor: Tự động bắt lỗi 401 để gọi API refresh token hoặc chuyển về `/login`.
2. **Ant Design Config & React Router**:
   - Thiết lập `ConfigProvider` Ant Design (Color primary, Dark/Light theme).
   - Thiết lập `AppRoutes.tsx` chuẩn bị các route placeholder.

---

### 📌 Module 1: Authentication & Authorization (Đăng Ký, Đăng Nhập & Phân Quyền)

> **Mục tiêu**: Đăng ký học viên/giảng viên, Đăng nhập nhận JWT Access/Refresh Token, tự động duy trì phiên đăng nhập và bảo vệ Route theo vai trò (`ADMIN`, `LECTURER`, `STUDENT`).

#### 🔧 Backend (`backend/src/modules/auth/`)
- `auth.schema.ts`: Schema Zod validate `registerSchema`, `loginSchema`, `refreshTokenSchema`.
- `auth.service.ts`:
  - `register()`: Hash password với bcryptjs, kiểm tra trùng email, tạo user trong PostgreSQL qua Prisma.
  - `login()`: Kiểm tra email/password, cấp pair token: Access Token (1h) + Refresh Token (7d).
  - `refreshToken()`: Verify Refresh Token, cấp Access Token mới.
- `auth.controller.ts` & `auth.routes.ts`:
  - `POST /api/v1/auth/register` (Public)
  - `POST /api/v1/auth/login` (Public)
  - `POST /api/v1/auth/refresh-token` (Public)
  - `GET /api/v1/auth/me` (Protected: `authenticate`)
- Middlewares: `authenticate.ts` (Verify Bearer Token), `authorize.ts` (RBAC role check).

#### 🎨 Frontend (`frontend/src/`)
- `AuthContext.tsx`: Lưu trữ state `user`, `accessToken`, hàm `login()`, `logout()`, `register()`.
- `AuthLayout.tsx`: Giao diện split-screen đẹp mắt (Logo + Illustration + Card Form).
- `LoginPage.tsx`: Form Ant Design đăng nhập (Email, Password), hiển thị notification báo lỗi hoặc thành công.
- `RegisterPage.tsx`: Form đăng ký (Họ tên, Email, Mật khẩu, Chọn vai trò Học viên / Giảng viên).
- `ProtectedRoute.tsx`: Component bọc các route yêu cầu đăng nhập hoặc kiểm tra vai trò người dùng.

---

### 📌 Module 2: User Profile & Account Management

> **Mục tiêu**: Xem/cập nhật thông tin cá nhân, đổi mật khẩu và trang quản lý người dùng dành cho Admin.

#### 🔧 Backend (`backend/src/modules/users/`)
- Endpoints:
  - `GET /api/v1/users/profile` (Protected) -> Lấy thông tin cá nhân.
  - `PUT /api/v1/users/profile` (Protected) -> Cập nhật họ tên, bio, avatar URL.
  - `PUT /api/v1/users/change-password` (Protected) -> Đổi mật khẩu.
  - `GET /api/v1/users` (Protected: Admin) -> Danh sách người dùng (Phân trang, lọc theo role).
  - `PATCH /api/v1/users/:id/status` (Protected: Admin) -> Khóa/Kích hoạt tài khoản.

#### 🎨 Frontend (`frontend/src/`)
- `MainLayout.tsx`: Layout chính chứa Header (Avatar dropdown, thông tin user) & Sidebar navigation.
- `ProfilePage.tsx`: Form tab Ant Design (Thông tin cá nhân & Đổi mật khẩu).
- `UserManagementPage.tsx` *(Admin)*: Bảng `Table` Ant Design liệt kê người dùng, Switch khóa/mở tài khoản, Tag hiển thị role.

---

### 📌 Module 3: Course Management (Quản Lý Khóa Học)

> **Mục tiêu**: Giảng viên tạo và quản lý khóa học; Học viên duyệt danh sách khóa học công khai.

#### 🔧 Backend (`backend/src/modules/courses/`)
- Endpoints:
  - `POST /api/v1/courses` *(Lecturer/Admin)*: Tạo khóa học mới (`title`, `slug`, `description`, `price`, `level`).
  - `PUT /api/v1/courses/:id` *(Lecturer/Admin)*: Sửa thông tin khóa học.
  - `PATCH /api/v1/courses/:id/status` *(Lecturer/Admin)*: Đổi trạng thái (`DRAFT`, `PUBLISHED`).
  - `GET /api/v1/courses` *(Public)*: Danh sách khóa học (Phân trang, tìm kiếm theo tên, lọc theo cấp độ).
  - `GET /api/v1/courses/:slug` *(Public)*: Chi tiết khóa học theo slug.

#### 🎨 Frontend (`frontend/src/`)
- `TeacherCourseListPage.tsx` *(Giảng viên)*: Danh sách khóa học do giảng viên quản lý (Badge trạng thái Draft/Published, nút Tạo mới).
- `CourseCreateModal` / `CourseEditPage`: Form tạo/sửa khóa học (Tự động tạo Slug từ Title, chọn Level, nhập Giá).
- `CourseCatalogPage.tsx` *(Học viên)*: Trang danh sách khóa học dạng Card Grid, thanh Search & Filter Ant Design.

---

### 📌 Module 4: Chapters, Lessons & Cloudflare R2 Upload

> **Mục tiêu**: Xây dựng khung bài học (Chương & Bài học), tích hợp tải Video/PDF lên Cloudflare R2 bằng Presigned URL.

#### 🔧 Backend (`backend/src/modules/chapters/`, `lessons/`, `upload/`)
- `upload.service.ts`: AWS S3 SDK Client kết nối Cloudflare R2 Endpoint.
  - `POST /api/v1/upload/presigned-url`: Sinh URL upload file an toàn.
- `chapters.routes.ts`: CRUD chương học (`title`, `order_index`).
- `lessons.routes.ts`: CRUD bài học (`title`, `video_url`, `pdf_url`, `content`, `is_free_preview`, `duration`).

#### 🎨 Frontend (`frontend/src/`)
- `CourseBuilderPage.tsx` *(Giảng viên)*:
  - Giao diện dạng cây (Tree / Collapse Ant Design) để thêm/sửa/xóa/sắp xếp Chương và Bài học.
  - Tích hợp Ant Design `Upload`: Tự động gọi API lấy Presigned URL và tải Video/PDF thẳng lên Cloudflare R2 với thanh Progress Bar.

---

### 📌 Module 5: Student Enrollment & Learning Experience

> **Mục tiêu**: Học viên đăng ký khóa học và tham gia giao diện học bài tập trung chuyên nghiệp.

#### 🔧 Backend (`backend/src/modules/enrollments/`)
- Endpoints:
  - `POST /api/v1/courses/:courseId/enroll` *(Student)*: Đăng ký khóa học.
  - `GET /api/v1/enrollments/my-courses` *(Student)*: Khóa học đã đăng ký kèm % tiến độ.
  - `POST /api/v1/lessons/:lessonId/complete` *(Student)*: Đánh dấu hoàn thành bài học.
  - `DELETE /api/v1/lessons/:lessonId/complete` *(Student)*: Bỏ đánh dấu bài học.

#### 🎨 Frontend (`frontend/src/`)
- `CourseDetailPage.tsx`: Trang giới thiệu khóa học, danh sách chương học, nút "Đăng ký học ngay".
- `LearningLayout.tsx` & `LearningPage.tsx`:
  - Khung xem bài học chuyên nghiệp (Video HTML5 Player / PDF Viewer bên trái).
  - Sidebar bài học bên phải (Hiển thị các bài học, tích xanh bài đã học, tính % Progress Bar).

---

### 📌 Module 6: Question Bank & Quizzes (Bài Kiểm Tra Trắc Nghiệm)

> **Mục tiêu**: Giảng viên soạn ngân hàng câu hỏi & bài test; Học viên làm bài kiểm tra đếm ngược thời gian và nhận kết quả tự động.

#### 🔧 Backend (`backend/src/modules/quizzes/`)
- Endpoints:
  - CRUD Ngân hàng câu hỏi (`bank_questions`, `bank_question_options`).
  - `POST /api/v1/lessons/:lessonId/quizzes/start`: Khởi tạo lượt làm bài (`quiz_attempts`).
  - `POST /api/v1/quiz-attempts/:attemptId/submit`: Nộp bài, chấm điểm tự động dựa trên đáp án đúng.
  - `GET /api/v1/quiz-attempts/:attemptId/result`: Kết quả bài làm chi tiết.

#### 🎨 Frontend (`frontend/src/`)
- `QuizBuilderPage`: Giảng viên tạo câu hỏi trắc nghiệm & chọn đáp án đúng.
- `QuizAttemptPage`: Học viên làm bài trắc nghiệm với đồng hồ đếm ngược, danh sách câu hỏi Radio/Checkbox, nút Nộp bài & Modal xem kết quả điểm số.

---

### 📌 Module 7: Comments & Dashboard Analytics

> **Mục tiêu**: Thảo luận hỏi đáp trong bài học & Trang thống kê báo cáo số liệu.

#### 🔧 Backend (`backend/src/modules/comments/`, `analytics/`)
- API bình luận bài học phân tầng (Parent-child reply).
- API thống kê số lượng học viên, doanh thu, khóa học hot.

#### 🎨 Frontend (`frontend/src/`)
- Component `CommentSection` bên dưới bài học.
- Trang `DashboardPage` hiển thị biểu đồ thống kê với Recharts / Ant Design Charts.

---

## 📊 Quyết Định & Các Bước Thực Thi Đầu Tiên (Immediate Step)

Chúng ta sẽ khởi động **Giai Đoạn 0** và **Module 1 (Auth)** ngay lập tức:

1. **Backend**:
   - Tạo thư mục `src/common` (`errors/`, `middlewares/`, `utils/api-response.ts`).
   - Xây dựng `src/modules/auth/` (Service, Controller, Schema Zod, Routes).
2. **Frontend**:
   - Cấu hình `src/api/axios-client.ts` (Interceptor gắn Token & xử lý lỗi).
   - Xây dựng `AuthContext`, `LoginPage`, `RegisterPage` với Ant Design UI.
