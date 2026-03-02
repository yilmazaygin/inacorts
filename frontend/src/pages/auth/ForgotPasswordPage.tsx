import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { authApi } from '@/api/auth';
import { getErrorMessage } from '@/utils/format';

type Step = 'username' | 'questions' | 'reset' | 'success';

export const ForgotPasswordPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('username');
  const [username, setUsername] = useState('');
  const [question1, setQuestion1] = useState('');
  const [question2, setQuestion2] = useState('');
  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Step 1: Fetch security questions by username
  const handleGetQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.getForgotPasswordQuestions({ username });
      if (!response.has_questions) {
        setError(t('auth.noSecurityQuestions'));
        return;
      }
      setQuestion1(response.security_question_1 || '');
      setQuestion2(response.security_question_2 || '');
      setStep('questions');
    } catch (err: any) {
      setError(getErrorMessage(err, t('auth.userNotFound')));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify security answers (without resetting password)
  const handleVerifyAnswers = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.verifyForgotPasswordAnswers({
        username,
        security_answer_1: answer1,
        security_answer_2: answer2,
      });
      // Answers are correct — transition to password reset step
      setError('');
      setStep('reset');
    } catch (err: any) {
      setError(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset password (answers already verified, but backend re-verifies)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPasswordWithSecurityAnswers({
        username,
        security_answer_1: answer1,
        security_answer_2: answer2,
        new_password: newPassword,
      });
      setStep('success');
    } catch (err: any) {
      setError(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      {/* Top-right settings: Language + Theme switchers (same as login) */}
      <div className="fixed top-4 right-4 flex items-center space-x-2 z-50">
        <div className="flex rounded-lg overflow-hidden shadow-sm">
          <button
            onClick={() => changeLanguage('tr')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              i18n.language === 'tr'
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            TR
          </button>
          <button
            onClick={() => changeLanguage('en')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              i18n.language === 'en'
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            EN
          </button>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-sm transition-colors"
          title={theme === 'light' ? t('common.darkMode') : t('common.lightMode')}
        >
          {theme === 'light' ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('auth.forgotPasswordTitle')}</h1>
        </div>

        {/* Step 1: Enter username */}
        {step === 'username' && (
          <form onSubmit={handleGetQuestions} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('auth.forgotPasswordDescription')}</p>
            {error && <ErrorMessage message={error} />}
            <Input
              label={t('auth.username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.enterUsername')}
              required
              fullWidth
              autoFocus
            />
            <Button type="submit" fullWidth loading={isLoading} disabled={!username}>
              {t('auth.getQuestions')}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                {t('auth.backToLogin')}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Answer security questions (no password fields here) */}
        {step === 'questions' && (
          <form onSubmit={handleVerifyAnswers} className="space-y-4">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">{t('auth.answersWarning')}</p>
            </div>

            {error && <ErrorMessage message={error} />}

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.securityQuestion1')}</p>
              {/* Security question text is shown as-is (never translated — user's original language) */}
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-2">{question1}</p>
              <Input
                value={answer1}
                onChange={(e) => setAnswer1(e.target.value)}
                placeholder={t('auth.answerPlaceholder')}
                required
                fullWidth
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.securityQuestion2')}</p>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-2">{question2}</p>
              <Input
                value={answer2}
                onChange={(e) => setAnswer2(e.target.value)}
                placeholder={t('auth.answerPlaceholder')}
                required
                fullWidth
              />
            </div>

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              disabled={!answer1 || !answer2}
            >
              {t('auth.verifyAnswers')}
            </Button>
            <div className="text-center">
              {/* "Back to Login" navigates directly to /admin/login, NOT back to username step */}
              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                {t('auth.backToLogin')}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Password reset (only shown after answers are verified) */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('auth.enterNewPasswordDescription')}</p>
            {error && <ErrorMessage message={error} />}
            <Input
              label={t('auth.newPassword')}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              fullWidth
              autoFocus
            />
            <Input
              label={t('auth.confirmNewPassword')}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              fullWidth
            />
            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              disabled={!newPassword || !confirmPassword}
            >
              {t('auth.resetPassword')}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                {t('auth.backToLogin')}
              </button>
            </div>
          </form>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-700 dark:text-gray-300">{t('auth.passwordResetSuccess')}</p>
            <Button fullWidth onClick={() => navigate('/admin/login')}>
              {t('auth.backToLogin')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
