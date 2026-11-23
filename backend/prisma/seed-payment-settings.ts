import prisma from "../src/prisma";

interface DefaultSetting {
  key: string;
  value: string;
  description: string;
}

const DEFAULT_PAYMENT_SETTINGS: DefaultSetting[] = [
  {
    key: "default_platform_fee_rate",
    value: "30",
    description:
      "Tỉ lệ hoa hồng mặc định của nền tảng/Admin (%) trên mỗi đơn hàng khóa học (0 - 100).",
  },
  {
    key: "min_payout_amount",
    value: "100000",
    description:
      "Số tiền tối thiểu (VND) giảng viên có thể tạo yêu cầu rút tiền từ ví.",
  },
  {
    key: "order_expiry_minutes",
    value: "15",
    description:
      "Thời gian hiệu lực (phút) của một đơn hàng / mã VietQR PayOS trước khi tự động hết hạn.",
  },
];

async function main() {
  let createdCount = 0;

  for (const item of DEFAULT_PAYMENT_SETTINGS) {
    const existing = await prisma.platform_settings.findUnique({
      where: { key: item.key },
    });

    if (!existing) {
      await prisma.platform_settings.create({
        data: {
          key: item.key,
          value: item.value,
          description: item.description,
        },
      });
      createdCount++;
    }
  }

  const allSettings = await prisma.platform_settings.findMany({
    orderBy: { key: "asc" },
  });

  console.log("=== Seed Payment Settings Summary ===");
  console.log(`New settings created: ${createdCount}`);
  console.log("Current platform_settings:");
  for (const s of allSettings) {
    console.log(`  - ${s.key} = ${s.value}`);
  }
}

main()
  .catch((err) => {
    console.error("Seed payment settings failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
