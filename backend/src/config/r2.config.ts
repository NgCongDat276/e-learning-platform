import { S3Client } from "@aws-sdk/client-s3";
import { envConfig } from "./env.config";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${envConfig.R2.ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: envConfig.R2.ACCESS_KEY_ID,
    secretAccessKey: envConfig.R2.SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

