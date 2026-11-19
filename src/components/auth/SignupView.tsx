import React, { useState } from 'react';
import AuthField from './AuthField';
import LoadingLabel from '../common/LoadingLabel';
import { PASSWORD_RULE_TEXT, getEmailError, getNicknameError, getPasswordError } from '../../utils/validation';
import { ROUTES } from '../../routes';
import type { SignupRequest } from '../../types/neareast';
import './AuthView.css';

interface SignupViewProps {
  isDemoMode: boolean;
  // 실패하면 화면에 보여줄 문구를 던진다
  onSignup: (request: SignupRequest) => Promise<void>;
}

interface SignupErrors {
  email?: string;
  nickname?: string;
  password?: string;
  passwordConfirm?: string;
}

function validateSignup(email: string, nickname: string, password: string, passwordConfirm: string): SignupErrors {
  // 오류가 있는 칸만 키를 넣는다 — 호출하는 쪽이 Object.keys로 오류 개수를 센다
  const errors: SignupErrors = {};
  const emailError = getEmailError(email);
  const nicknameError = getNicknameError(nickname);
  const passwordError = getPasswordError(password);
  if (emailError !== undefined) errors.email = emailError;
  if (nicknameError !== undefined) errors.nickname = nicknameError;
  if (passwordError !== undefined) errors.password = passwordError;
  if (passwordConfirm !== password) errors.passwordConfirm = '비밀번호가 서로 달라요.';
  return errors;
}

const SignupView: React.FC<SignupViewProps> = ({ isDemoMode, onSignup }) => {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<SignupErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors = validateSignup(email, nickname, password, passwordConfirm);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSignup({ email: email.trim(), nickname: nickname.trim(), password });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '가입하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="AuthView">
      <div className="AuthView-Card motion-stagger">
        <h1 className="AuthView-Title">회원가입</h1>
        <p className="AuthView-Subtitle">가입하면 여행 일정을 저장하고 언제든 다시 볼 수 있어요.</p>

        {isDemoMode && (
          <p className="AuthView-DemoNotice">
            데모 모드예요. 이메일과 닉네임만 이 브라우저에 기억하고, 비밀번호는 저장하지 않아요.
          </p>
        )}

        <form className="AuthView-Form" onSubmit={handleSubmit} noValidate>
          <AuthField
            id="signup-email"
            label="이메일"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            placeholder="you@example.com"
            error={fieldErrors.email}
          />
          <AuthField
            id="signup-nickname"
            label="닉네임"
            type="text"
            value={nickname}
            onChange={setNickname}
            autoComplete="nickname"
            hint="2~12자, 헤더에 ‘OOO님’으로 보여요."
            error={fieldErrors.nickname}
          />
          <AuthField
            id="signup-password"
            label="비밀번호"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            hint={PASSWORD_RULE_TEXT}
            error={fieldErrors.password}
          />
          <AuthField
            id="signup-password-confirm"
            label="비밀번호 확인"
            type="password"
            value={passwordConfirm}
            onChange={setPasswordConfirm}
            autoComplete="new-password"
            error={fieldErrors.passwordConfirm}
          />

          {formError !== null && (
            <p className="AuthView-FormError" role="alert">
              {formError}
            </p>
          )}

          <button type="submit" className="AuthView-SubmitButton" disabled={isSubmitting}>
            <LoadingLabel isLoading={isSubmitting} loadingText="가입하는 중…">가입하기</LoadingLabel>
          </button>
        </form>

        <p className="AuthView-Switch">
          이미 회원이신가요? <a href={ROUTES.login}>로그인</a>
        </p>
      </div>
    </div>
  );
};

export default SignupView;
