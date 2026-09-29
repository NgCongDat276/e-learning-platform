import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import prisma from "./prisma";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
// Import các tiện ích và middleware từ common
import { NotFoundError } from "./common/errors/app-error";
import { errorHandler } from "./common/middlewares/error-handler";
import { sendSuccess } from "./common/utils/api-response";

const app: Express = express();

// Middlewares cơ bản
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger setup
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Online Course Management API",
      version: "1.0.0",
      description: "API Documentation for Graduation Thesis LMS Project",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development Server",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint (Dùng kiểm tra trạng thái server & database)
app.get("/health", async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.users.count();

    return sendSuccess(
      res,
      { totalUser: userCount },
      "Backend server Node 22 & PostgreSQL connected successfully!",
    );
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Backend server Node 22 & PostgreSQL connection failed!",
      timestamp: new Date().toISOString(),
    });
  }
});

// ⚠️ XỬ LÝ ROUTE KHÔNG TỒN TẠI (404 NOT FOUND) (đặt sau tất cả route khác)

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);

app.use((req: Request, res: Response, next: NextFunction) => {
  next(
    new NotFoundError(
      `Không tìm thấy đường dẫn ${req.method} ${req.originalUrl}`,
    ),
  );
});

// 💥 GLOBAL ERROR HANDLER (đặt ở cuối)
app.use(errorHandler);

export default app;
