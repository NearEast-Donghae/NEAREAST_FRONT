// 회원가입·마이페이지가 같은 규칙을 쓰도록 입력 검사를 한 곳에 둔다 (백엔드도 같은 규칙으로 다시 검사해야 한다)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;
export const PASSWORD_RULE_TEXT = `영문과 숫자를 섞어 ${MIN_PASSWORD_LENGTH}자 이상`;

export function getEmailError(email: string): string | undefined {
  return EMAIL_PATTERN.test(email.trim()) ? undefined : '이메일 형식을 확인해 주세요.';
}

export function getNicknameError(nickname: string): string | undefined {
  const length = nickname.trim().length;
  return length >= 2 && length <= 12 ? undefined : '닉네임은 2~12자로 입력해 주세요.';
}

export function getPasswordError(password: string): string | undefined {
  const isValid = password.length >= MIN_PASSWORD_LENGTH && /[A-Za-z]/.test(password) && /\d/.test(password);
  return isValid ? undefined : `${PASSWORD_RULE_TEXT} 입력해 주세요.`;
}
