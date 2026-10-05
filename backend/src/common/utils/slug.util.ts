/**
 * 1. Tiện ích chuyển đổi chuỗi tiếng Việt có dấu thành URL slug chuẩn SEO
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Bỏ dấu tiếng Việt
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "") // Xóa ký tự đặc biệt
    .trim()
    .replace(/\s+/g, "-") // Thay khoảng trắng bằng gạch nối
    .replace(/-+/g, "-"); // Tránh lặp nhiều dấu gạch nối
}

/**
 * 2. Hàm tổng quát tự động sinh slug duy nhất không trùng lặp cho bất kỳ thực thể nào
 * @param title Tiêu đề gốc cần chuyển thành slug
 * @param checkExists Hàm bất đồng bộ kiểm tra xem slug đã bị trùng hay chưa (trả về true nếu đã tồn tại)
 * @param fallbackPrefix Tiền tố thay thế nếu title rỗng (mặc định: 'item')
 */
export async function generateUniqueSlug(
  title: string,
  checkExists: (slug: string) => Promise<boolean>,
  fallbackPrefix: string = "item",
): Promise<string> {
  const baseSlug = slugify(title) || fallbackPrefix;
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
