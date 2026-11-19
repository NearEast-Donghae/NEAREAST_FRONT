import React, { useState } from 'react';
import AuthField from '../auth/AuthField';
import LoadingLabel from '../common/LoadingLabel';
import { PASSWORD_RULE_TEXT, getNicknameError, getPasswordError } from '../../utils/validation';
import type { AuthUser, ChangePasswordRequest } from '../../types/neareast';
import '../auth/AuthView.css'; // 입력칸(AuthField) 스타일을 로그인·회원가입과 같이 쓴다
import './MyPageView.css';

interface MyPageViewProps {
  // 로그인 전에도 흐림 처리된 채로 그려지므로 null일 수 있다
  user: AuthUser | null;
  isDemoMode: boolean;
  // 실패하면 화면에 보여줄 문구를 던진다
  onUpdateNickname: (nickname: string) => Promise<void>;
  onChangePassword: (request: ChangePasswordRequest) => Promise<void>;
  onLogout: () => void;
  onDeleteAccount: () => Promise<void>;
}

const errorMessageOf = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

// ── 내 정보 ──

const ProfileSection: React.FC<Pick<MyPageViewProps, 'user' | 'onUpdateNickname'>> = ({ user, onUpdateNickname }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    setNickname(user?.nickname ?? '');
    setError(undefined);
    setNotice(null);
    setIsEditing(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const nicknameError = getNicknameError(nickname);
    setError(nicknameError);
    if (nicknameError !== undefined) return;

    setIsSaving(true);
    try {
      await onUpdateNickname(nickname.trim());
      setIsEditing(false);
      setNotice('닉네임을 바꿨어요.');
    } catch (saveError) {
      setError(errorMessageOf(saveError, '닉네임을 바꾸지 못했어요.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="MyPageView-Card" aria-labelledby="MyPage-ProfileTitle">
      <h2 id="MyPage-ProfileTitle" className="MyPageView-CardTitle">내 정보</h2>

      <div className="MyPageView-ProfileHead">
        <span className="MyPageView-Avatar" aria-hidden="true">
          {user?.nickname.slice(0, 1) ?? '?'}
        </span>
        <div>
          <p className="MyPageView-Nickname">{user?.nickname ?? '-'}님</p>
          <p className="MyPageView-Email">{user?.email ?? '-'}</p>
        </div>
      </div>

      <dl className="MyPageView-InfoList">
        <div className="MyPageView-InfoRow">
          <dt>이메일</dt>
          <dd>{user?.email ?? '-'}</dd>
        </div>
        <div className="MyPageView-InfoRow">
          <dt>닉네임</dt>
          <dd>
            {isEditing ? (
              <form className="MyPageView-InlineForm" onSubmit={handleSave} noValidate>
                <AuthField
                  id="mypage-nickname"
                  label="새 닉네임"
                  type="text"
                  value={nickname}
                  onChange={setNickname}
                  autoComplete="nickname"
                  hint="2~12자"
                  error={error}
                />
                <div className="MyPageView-InlineActions">
                  <button type="submit" className="MyPageView-Button MyPageView-Button--primary" disabled={isSaving}>
                    <LoadingLabel isLoading={isSaving} loadingText="저장 중…">저장</LoadingLabel>
                  </button>
                  <button type="button" className="MyPageView-Button" onClick={() => setIsEditing(false)}>
                    취소
                  </button>
                </div>
              </form>
            ) : (
              <div className="MyPageView-ValueWithAction">
                <span>{user?.nickname ?? '-'}</span>
                <button className="MyPageView-TextButton" onClick={handleStartEdit} disabled={user === null}>
                  수정
                </button>
              </div>
            )}
          </dd>
        </div>
      </dl>

      {notice !== null && (
        <p className="MyPageView-Notice" role="status">
          {notice}
        </p>
      )}
    </section>
  );
};

// ── 비밀번호 변경 ──

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  newPasswordConfirm?: string;
}

const PasswordSection: React.FC<Pick<MyPageViewProps, 'isDemoMode' | 'onChangePassword'>> = ({
  isDemoMode,
  onChangePassword,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<PasswordErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: PasswordErrors = {};
    if (currentPassword === '') errors.currentPassword = '현재 비밀번호를 입력해 주세요.';
    const newPasswordError = getPasswordError(newPassword);
    if (newPasswordError !== undefined) errors.newPassword = newPasswordError;
    else if (newPassword === currentPassword) errors.newPassword = '현재 비밀번호와 다른 비밀번호를 입력해 주세요.';
    if (newPasswordConfirm !== newPassword) errors.newPasswordConfirm = '새 비밀번호가 서로 달라요.';

    setFieldErrors(errors);
    setFormError(null);
    setNotice(null);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onChangePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setNotice('비밀번호를 바꿨어요.');
    } catch (submitError) {
      setFormError(errorMessageOf(submitError, '비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="MyPageView-Card" aria-labelledby="MyPage-PasswordTitle">
      <h2 id="MyPage-PasswordTitle" className="MyPageView-CardTitle">비밀번호 변경</h2>
      {isDemoMode && (
        <p className="AuthView-DemoNotice">
          데모 모드예요. 입력 형식만 확인하고, 비밀번호는 실제로 저장하거나 바꾸지 않아요.
        </p>
      )}

      <form className="MyPageView-Form" onSubmit={handleSubmit} noValidate>
        <AuthField
          id="mypage-current-password"
          label="현재 비밀번호"
          type="password"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
          error={fieldErrors.currentPassword}
        />
        <AuthField
          id="mypage-new-password"
          label="새 비밀번호"
          type="password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          hint={PASSWORD_RULE_TEXT}
          error={fieldErrors.newPassword}
        />
        <AuthField
          id="mypage-new-password-confirm"
          label="새 비밀번호 확인"
          type="password"
          value={newPasswordConfirm}
          onChange={setNewPasswordConfirm}
          autoComplete="new-password"
          error={fieldErrors.newPasswordConfirm}
        />

        {formError !== null && (
          <p className="AuthView-FormError" role="alert">
            {formError}
          </p>
        )}
        {notice !== null && (
          <p className="MyPageView-Notice" role="status">
            {notice}
          </p>
        )}

        <button type="submit" className="MyPageView-Button MyPageView-Button--primary MyPageView-Button--wide" disabled={isSubmitting}>
          <LoadingLabel isLoading={isSubmitting} loadingText="바꾸는 중…">비밀번호 변경</LoadingLabel>
        </button>
      </form>
    </section>
  );
};

// ── 계정 ──

const AccountSection: React.FC<Pick<MyPageViewProps, 'onLogout' | 'onDeleteAccount'>> = ({
  onLogout,
  onDeleteAccount,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('정말 탈퇴할까요?\n계정과 계정 정보는 되돌릴 수 없어요.')) return;
    setError(null);
    setIsDeleting(true);
    try {
      await onDeleteAccount();
    } catch (deleteError) {
      setError(errorMessageOf(deleteError, '탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요.'));
      setIsDeleting(false);
    }
  };

  return (
    <section className="MyPageView-Card" aria-labelledby="MyPage-AccountTitle">
      <h2 id="MyPage-AccountTitle" className="MyPageView-CardTitle">계정</h2>

      <div className="MyPageView-AccountRow">
        <div>
          <p className="MyPageView-AccountLabel">로그아웃</p>
          <p className="MyPageView-AccountText">이 브라우저에서 로그아웃해요.</p>
        </div>
        <button className="MyPageView-Button" onClick={onLogout}>
          로그아웃
        </button>
      </div>

      <div className="MyPageView-AccountRow">
        <div>
          <p className="MyPageView-AccountLabel">회원 탈퇴</p>
          <p className="MyPageView-AccountText">계정을 삭제해요. 탈퇴하면 되돌릴 수 없어요.</p>
        </div>
        <button className="MyPageView-Button MyPageView-Button--danger" onClick={handleDelete} disabled={isDeleting}>
          <LoadingLabel isLoading={isDeleting} loadingText="탈퇴하는 중…">회원 탈퇴</LoadingLabel>
        </button>
      </div>

      {error !== null && (
        <p className="AuthView-FormError" role="alert">
          {error}
        </p>
      )}
    </section>
  );
};

// ── 마이페이지 ──

const MyPageView: React.FC<MyPageViewProps> = (props) => {
  return (
    <div className="MyPageView motion-stagger">
      <h1 className="MyPageView-Title">마이페이지</h1>
      <div className="MyPageView-Sections">
        <ProfileSection user={props.user} onUpdateNickname={props.onUpdateNickname} />
        <PasswordSection isDemoMode={props.isDemoMode} onChangePassword={props.onChangePassword} />
        <AccountSection onLogout={props.onLogout} onDeleteAccount={props.onDeleteAccount} />
      </div>
    </div>
  );
};

export default MyPageView;
