import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Badge } from '@/components/common/Badge';
import { usersApi } from '@/api/users';
import { authApi } from '@/api/auth';
import { getErrorMessage } from '@/utils/format';
import type { UserProfileUpdate, SecurityQuestionUpdate, ChangePasswordRequest } from '@/types/entities';

export const MyAccountPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();

  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<UserProfileUpdate>({});
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Security answer visibility (answers are hashed — eye toggle shows info message)
  const [showAnswer1, setShowAnswer1] = useState(false);
  const [showAnswer2, setShowAnswer2] = useState(false);

  // Accordion: Change Password & Security Questions
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Change Password (inside accordion)
  const [pwForm, setPwForm] = useState({ new_password: '', confirm_password: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

  // Security Questions update (inside accordion)
  const [sqForm, setSqForm] = useState({
    security_question_1: '',
    security_answer_1: '',
    security_question_2: '',
    security_answer_2: '',
  });
  const [deleteQ1, setDeleteQ1] = useState(false);
  const [deleteQ2, setDeleteQ2] = useState(false);
  const [sqError, setSqError] = useState('');
  const [sqSuccess, setSqSuccess] = useState('');
  const [sqSubmitting, setSqSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        email: user.email || '',
        name: user.name || '',
        surname: user.surname || '',
        address: user.address || '',
        backup_email: user.backup_email || '',
        phone_number: user.phone_number || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (passwordVerified && user) {
      setSqForm({
        security_question_1: user.security_question_1 || '',
        security_answer_1: '',
        security_question_2: user.security_question_2 || '',
        security_answer_2: '',
      });
      setDeleteQ1(false);
      setDeleteQ2(false);
    }
  }, [passwordVerified, user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    try {
      setProfileSubmitting(true);
      await usersApi.updateProfile(profileForm);
      setProfileSuccess(t('users.profileUpdated'));
      setIsEditingProfile(false);
      await refreshUser();
    } catch (err: any) {
      setProfileError(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleVerifyPassword = async () => {
    setVerifyError('');
    setVerifyLoading(true);
    try {
      await authApi.verifyPassword({ password: currentPassword });
      setPasswordVerified(true);
    } catch (err: any) {
      setVerifyError(getErrorMessage(err, t('users.incorrectPassword')));
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError(t('users.passwordsDoNotMatch'));
      return;
    }

    const data: ChangePasswordRequest = {
      current_password: currentPassword,
      new_password: pwForm.new_password,
    };

    try {
      setPwSubmitting(true);
      await usersApi.changePassword(data);
      setPwSuccess(t('users.passwordChanged'));
      setPwForm({ new_password: '', confirm_password: '' });
    } catch (err: any) {
      setPwError(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setPwSubmitting(false);
    }
  };

  const handleSecurityQuestionsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSqError('');
    setSqSuccess('');

    const data: SecurityQuestionUpdate = { current_password: currentPassword };

    if (deleteQ1) {
      data.security_question_1 = '';
      data.security_answer_1 = '';
    } else if (sqForm.security_question_1 && sqForm.security_answer_1) {
      data.security_question_1 = sqForm.security_question_1;
      data.security_answer_1 = sqForm.security_answer_1;
    }

    if (deleteQ2) {
      data.security_question_2 = '';
      data.security_answer_2 = '';
    } else if (sqForm.security_question_2 && sqForm.security_answer_2) {
      data.security_question_2 = sqForm.security_question_2;
      data.security_answer_2 = sqForm.security_answer_2;
    }

    try {
      setSqSubmitting(true);
      await usersApi.updateSecurityQuestions(data);
      setSqSuccess(t('users.securityQuestionsSaved'));
      await refreshUser();
    } catch (err: any) {
      setSqError(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setSqSubmitting(false);
    }
  };

  const resetAccordion = () => {
    setAccordionOpen(false);
    setPasswordVerified(false);
    setCurrentPassword('');
    setVerifyError('');
    setPwForm({ new_password: '', confirm_password: '' });
    setPwError('');
    setPwSuccess('');
    setSqError('');
    setSqSuccess('');
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('users.myAccount')}</h1>

        {/* Profile Card */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4 min-w-0">
              <div className="w-14 h-14 flex-shrink-0 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{user?.username}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant={user?.is_admin ? 'info' : 'default'} size="sm">
                    {user?.is_admin ? t('users.admin') : t('users.user')}
                  </Badge>
                  <Badge variant={user?.has_security_questions ? 'success' : 'warning'} size="sm">
                    {t('users.securityQuestions')}: {user?.has_security_questions ? t('users.securityQuestionsSet') : t('users.securityQuestionsNotSet')}
                  </Badge>
                </div>
              </div>
            </div>
            {!isEditingProfile && (
              <Button variant="secondary" onClick={() => setIsEditingProfile(true)} className="self-start sm:flex-shrink-0">
                {t('common.edit')}
              </Button>
            )}
          </div>

          {profileError && <ErrorMessage message={profileError} />}
          {profileSuccess && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-300">{profileSuccess}</p>
            </div>
          )}

          {isEditingProfile ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('users.name')}
                  value={profileForm.name || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  fullWidth
                />
                <Input
                  label={t('users.surname')}
                  value={profileForm.surname || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, surname: e.target.value })}
                  fullWidth
                />
                <Input
                  label={t('users.email')}
                  type="email"
                  value={profileForm.email || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  fullWidth
                />
                <Input
                  label={t('users.backupEmail')}
                  type="email"
                  value={profileForm.backup_email || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, backup_email: e.target.value })}
                  fullWidth
                />
                <Input
                  label={t('users.phoneNumber')}
                  value={profileForm.phone_number || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                  fullWidth
                />
                <Input
                  label={t('users.address')}
                  value={profileForm.address || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  fullWidth
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="secondary" onClick={() => { setIsEditingProfile(false); setProfileError(''); setProfileSuccess(''); }} type="button">
                  {t('common.cancel')}
                </Button>
                <Button type="submit" loading={profileSubmitting}>
                  {t('common.save')}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: t('users.name'), value: user?.name },
                { label: t('users.surname'), value: user?.surname },
                { label: t('users.email'), value: user?.email },
                { label: t('users.backupEmail'), value: user?.backup_email },
                { label: t('users.phoneNumber'), value: user?.phone_number },
                { label: t('users.address'), value: user?.address },
              ].map((field, idx) => (
                <div key={idx}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{field.label}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{field.value || '-'}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Security Questions Display (read-only) */}
        {user?.has_security_questions && (
          <Card title={t('users.securityQuestions')}>
            <div className="space-y-4">
              {/* Question 1 */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('users.question1')}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.security_question_1 || '-'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('users.answer1')}</p>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white tracking-widest">
                    {showAnswer1 ? t('users.answersHashed') : '••••••••'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAnswer1(!showAnswer1)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title={showAnswer1 ? t('users.hideAnswer') : t('users.showAnswer')}
                  >
                    {showAnswer1 ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.879L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {/* Question 2 */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('users.question2')}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.security_question_2 || '-'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('users.answer2')}</p>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white tracking-widest">
                    {showAnswer2 ? t('users.answersHashed') : '••••••••'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAnswer2(!showAnswer2)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title={showAnswer2 ? t('users.hideAnswer') : t('users.showAnswer')}
                  >
                    {showAnswer2 ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.879L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Accordion: Change Password & Security Questions */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => { if (accordionOpen) resetAccordion(); else setAccordionOpen(true); }}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('users.changePasswordAndSecurity')}
            </h3>
            <svg
              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${accordionOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {accordionOpen && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {/* Step 1: Verify current password */}
              {!passwordVerified ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('users.verifyPasswordFirst')}</p>
                  {verifyError && <ErrorMessage message={verifyError} />}
                  <div className="flex items-end space-x-3">
                    <div className="flex-1">
                      <Input
                        label={t('users.currentPassword')}
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        fullWidth
                      />
                    </div>
                    <Button onClick={handleVerifyPassword} loading={verifyLoading} disabled={!currentPassword}>
                      {t('users.verify')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Change Password */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">{t('users.changePassword')}</h4>
                    {pwError && <ErrorMessage message={pwError} />}
                    {pwSuccess && (
                      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-300">{pwSuccess}</p>
                      </div>
                    )}
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <Input
                        label={t('users.newPassword')}
                        type="password"
                        value={pwForm.new_password}
                        onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                        required
                        fullWidth
                      />
                      <Input
                        label={t('users.confirmNewPassword')}
                        type="password"
                        value={pwForm.confirm_password}
                        onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                        required
                        fullWidth
                      />
                      <div className="flex justify-end pt-2">
                        <Button type="submit" loading={pwSubmitting}>
                          {t('users.changePassword')}
                        </Button>
                      </div>
                    </form>
                  </div>

                  <hr className="border-gray-200 dark:border-gray-700" />

                  {/* Security Questions Update */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">{t('users.updateSecurityQuestions')}</h4>
                    <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">{t('auth.answersWarning')}</p>
                    </div>

                    {sqError && <ErrorMessage message={sqError} />}
                    {sqSuccess && (
                      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-300">{sqSuccess}</p>
                      </div>
                    )}

                    <form onSubmit={handleSecurityQuestionsUpdate} className="space-y-4">
                      {/* Question 1 */}
                      <div className={`p-4 rounded-lg border ${deleteQ1 ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('users.question1')}</h5>
                          {user?.security_question_1 && (
                            <button
                              type="button"
                              onClick={() => setDeleteQ1(!deleteQ1)}
                              className={`text-xs font-medium ${deleteQ1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                            >
                              {deleteQ1 ? t('users.undoDelete') : t('users.deleteQuestion')}
                            </button>
                          )}
                        </div>
                        {!deleteQ1 && (
                          <>
                            <Input
                              value={sqForm.security_question_1}
                              onChange={(e) => setSqForm({ ...sqForm, security_question_1: e.target.value })}
                              placeholder={t('users.questionPlaceholder')}
                              fullWidth
                            />
                            <div className="mt-2">
                              <Input
                                value={sqForm.security_answer_1}
                                onChange={(e) => setSqForm({ ...sqForm, security_answer_1: e.target.value })}
                                placeholder={t('users.answerPlaceholder')}
                                fullWidth
                              />
                            </div>
                          </>
                        )}
                        {deleteQ1 && user?.security_question_1 && (
                          <p className="text-sm text-red-600 dark:text-red-400 line-through">{user.security_question_1}</p>
                        )}
                      </div>

                      {/* Question 2 */}
                      <div className={`p-4 rounded-lg border ${deleteQ2 ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('users.question2')}</h5>
                          {user?.security_question_2 && (
                            <button
                              type="button"
                              onClick={() => setDeleteQ2(!deleteQ2)}
                              className={`text-xs font-medium ${deleteQ2 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                            >
                              {deleteQ2 ? t('users.undoDelete') : t('users.deleteQuestion')}
                            </button>
                          )}
                        </div>
                        {!deleteQ2 && (
                          <>
                            <Input
                              value={sqForm.security_question_2}
                              onChange={(e) => setSqForm({ ...sqForm, security_question_2: e.target.value })}
                              placeholder={t('users.questionPlaceholder')}
                              fullWidth
                            />
                            <div className="mt-2">
                              <Input
                                value={sqForm.security_answer_2}
                                onChange={(e) => setSqForm({ ...sqForm, security_answer_2: e.target.value })}
                                placeholder={t('users.answerPlaceholder')}
                                fullWidth
                              />
                            </div>
                          </>
                        )}
                        {deleteQ2 && user?.security_question_2 && (
                          <p className="text-sm text-red-600 dark:text-red-400 line-through">{user.security_question_2}</p>
                        )}
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button type="submit" loading={sqSubmitting}>
                          {t('users.saveSecurityQuestions')}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
