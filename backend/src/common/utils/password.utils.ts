import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

// Băm mật khẩu thô thành chuỗi mã hóa an toàn
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// So sánh mật khẩu người dùng nhập vào với mật khẩu đã băm trong database
export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
