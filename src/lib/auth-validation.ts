const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email || email.trim().length === 0) {
    return "请输入邮箱地址";
  }
  if (email.length < 5) {
    return "邮箱地址格式不正确";
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return "邮箱地址格式不正确";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password || password.length === 0) {
    return "请输入密码";
  }
  if (password.length < 8) {
    return "密码至少需要 8 个字符";
  }
  if (!/[a-zA-Z]/.test(password)) {
    return "密码需要包含至少一个字母";
  }
  if (!/\d/.test(password)) {
    return "密码需要包含至少一个数字";
  }
  return null;
}

export function validateName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return null; // name is optional
  }
  if (name.trim().length > 50) {
    return "昵称不能超过 50 个字符";
  }
  return null;
}
