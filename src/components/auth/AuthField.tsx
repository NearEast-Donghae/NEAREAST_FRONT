import React from 'react';

interface AuthFieldProps {
  id: string;
  label: string;
  type: 'email' | 'password' | 'text';
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string;
  hint?: string;
  error?: string;
}

// 로그인·회원가입 공통 입력칸 — 오류가 있으면 입력칸 아래에 보여주고 스크린리더에도 연결한다
const AuthField: React.FC<AuthFieldProps> = ({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
  hint,
  error,
}) => {
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className="AuthView-Field">
      <label htmlFor={id} className="AuthView-Label">
        {label}
      </label>
      <input
        id={id}
        className={`AuthView-Input${error !== undefined ? ' AuthView-Input--error' : ''}`}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error !== undefined}
        aria-describedby={message !== undefined ? messageId : undefined}
      />
      {message !== undefined && (
        <p id={messageId} className={error !== undefined ? 'AuthView-FieldError' : 'AuthView-FieldHint'}>
          {message}
        </p>
      )}
    </div>
  );
};

export default AuthField;
