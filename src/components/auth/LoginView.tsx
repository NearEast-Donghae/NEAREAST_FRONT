import React, { useState } from 'react';
import AuthField from './AuthField';
import LoadingLabel from '../common/LoadingLabel';
import { ROUTES } from '../../routes';
import type { LoginRequest } from '../../types/neareast';
import './AuthView.css';

interface LoginViewProps {
  isDemoMode: boolean;
  // 실패하면 화면에 보여줄 문구를 던진다
  onLogin: (request: LoginRequest) => Promise<void>;
}

interface LoginErrors {
  email?: string;
  password?: string;
}

function validateLogin(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  if (email.trim() === '') errors.email = '이메일을 입력해 주세요.';
  if (password === '') errors.password = '비밀번호를 입력해 주세요.';
  return errors;
}

const LoginView: React.FC<LoginViewProps> = ({ isDemoMode, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors = validateLogin(email, password);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onLogin({ email: email.trim(), password });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '로그인하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="AuthView">
      <div className="AuthView-Card motion-stagger">
        <h1 className="AuthView-Title">로그인</h1>
        <p className="AuthView-Subtitle">저장한 여행 일정과 담아둔 장소를 이어서 볼 수 있어요.</p>

        {isDemoMode && (
          <p className="AuthView-DemoNotice">
            데모 모드예요. 가입한 이메일이면 로그인되고, 비밀번호는 확인하거나 저장하지 않아요.
          </p>
        )}

        <form className="AuthView-Form" onSubmit={handleSubmit} noValidate>
          <AuthField
            id="login-email"
            label="이메일"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            placeholder="you@example.com"
            error={fieldErrors.email}
          />
          <AuthField
            id="login-password"
            label="비밀번호"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            error={fieldErrors.password}
          />

          {formError !== null && (
            <p className="AuthView-FormError" role="alert">
              {formError}
            </p>
          )}

          <button type="submit" className="AuthView-SubmitButton" disabled={isSubmitting}>
            <LoadingLabel isLoading={isSubmitting} loadingText="로그인 중…">로그인</LoadingLabel>
          </button>
        </form>

        <p className="AuthView-Switch">
          아직 회원이 아니신가요? <a href={ROUTES.signup}>회원가입</a>
        </p>
      </div>
    </div>
  );
};

export default LoginView;
