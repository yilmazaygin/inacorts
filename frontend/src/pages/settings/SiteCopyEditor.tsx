import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { TextArea } from '@/components/common/TextArea';
import { Button } from '@/components/common/Button';
import type { FaqItem, SiteContent } from '@/types/site';

const AREAS = new Set([
  'faqLead',
  'storageNotice',
  'catalogIntro',
  'noProducts',
  'cartEmpty',
  'noConsultantPhone',
  'orderIntro',
  'howToOrderLead',
  'howToOrderStep1',
  'howToOrderStep2',
  'howToOrderStep3',
  'howToOrderStep4',
  'howToOrderClose',
]);

const PLACEHOLDERS = new Set(['productCount', 'unitListPrice', 'orderLine', 'lastEdited']);

const GROUPS: Array<{ title: string; keys: string[] }> = [
  {
    title: 'copyHome',
    keys: [
      'browseProducts', 'getInTouch', 'replyGuaranteeKicker', 'replyGuaranteeBefore', 'replyGuaranteeTime',
      'replyGuaranteeAfter', 'categories', 'featured', 'viewAll', 'orderHeading', 'howToOrder', 'about',
      'faqHeading', 'faqLead', 'contact',
    ],
  },
  {
    title: 'copyMenu',
    keys: [
      'home', 'products', 'myCart', 'cart', 'userAgreement', 'admin',
      'storageNoticeTitle', 'storageNotice', 'storageNoticeOk',
    ],
  },
  {
    title: 'copyCatalog',
    keys: [
      'catalogIntro', 'searchPlaceholder', 'category', 'allCategories', 'sort', 'sortAz', 'sortZa',
      'sortPriceAsc', 'sortPriceDesc', 'viewGrid', 'viewList', 'noProducts', 'listPrice', 'addToCart',
      'outOfStock', 'details', 'productCount', 'prevImage', 'nextImage',
    ],
  },
  {
    title: 'copyCart',
    keys: [
      'cartEmpty', 'cartIntroBefore', 'cartIntroLink', 'clearCart', 'unitListPrice', 'cartTotal',
      'acceptAgreementBefore', 'acceptAgreementName', 'acceptAgreementAfter', 'placeOrder',
      'pickConsultant', 'noConsultantPhone', 'orderIntro', 'orderLine',
    ],
  },
  {
    title: 'copyHowTo',
    keys: [
      'howToOrderLead',
      'howToOrderStep1Title', 'howToOrderStep1',
      'howToOrderStep2Title', 'howToOrderStep2',
      'howToOrderStep3Title', 'howToOrderStep3',
      'howToOrderStep4Title', 'howToOrderStep4',
      'howToOrderClose', 'orderAgreementBefore', 'orderAgreementName', 'orderAgreementAfter', 'goBack',
    ],
  },
  {
    title: 'copyAgreement',
    keys: ['agreementLanguage', 'lastEdited', 'printAgreement'],
  },
  {
    title: 'copyContact',
    keys: ['salesConsultant', 'phone', 'whatsapp', 'consultantEmail'],
  },
];

const blankFaq = (): FaqItem => ({ question_tr: '', question_en: '', answer_tr: '', answer_en: '' });

interface SiteCopyEditorProps {
  form: SiteContent;
  onChange: (next: SiteContent) => void;
}

export const SiteCopyEditor: React.FC<SiteCopyEditorProps> = ({ form, onChange }) => {
  const { t } = useTranslation();
  const labels = form.labels ?? {};
  const faqs = form.faqs ?? [];
  const setLabel = (key: string, value: string) => {
    onChange({ ...form, labels: { ...labels, [key]: value } });
  };

  const setFaq = (index: number, key: keyof FaqItem, value: string) => {
    onChange({
      ...form,
      faqs: faqs.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    });
  };

  const moveFaq = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= faqs.length) return;
    const copy = [...faqs];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onChange({ ...form, faqs: copy });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('site.pageCopy')}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('site.pageCopyHint')}</p>
      </div>
      {GROUPS.map((group) => (
        <Card key={group.title} title={t(`site.${group.title}`)}>
          <div className="grid gap-6 lg:grid-cols-2">
            {group.keys.map((key) => {
              const area = AREAS.has(key);
              const Field = area ? TextArea : Input;
              return (
                <div key={key} className="space-y-3">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t(`site.${key}`)}</p>
                  <Field
                    label={t('site.turkish')}
                    value={labels[`${key}_tr`] ?? ''}
                    onChange={(event) => setLabel(`${key}_tr`, event.target.value)}
                    fullWidth
                  />
                  <Field
                    label={t('site.english')}
                    value={labels[`${key}_en`] ?? ''}
                    onChange={(event) => setLabel(`${key}_en`, event.target.value)}
                    fullWidth
                  />
                  {PLACEHOLDERS.has(key) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('site.placeholderHint')}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ))}
      <Card title={t('site.copyFaq')}>
        <div className="space-y-8">
          {faqs.map((item, index) => (
            <div key={index} className="space-y-3 border-b border-gray-200 pb-6 last:border-b-0 dark:border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{index + 1}</p>
                <div className="flex gap-3 text-sm">
                  <button type="button" className="text-gray-600 hover:underline dark:text-gray-300" onClick={() => moveFaq(index, -1)}>{t('site.moveUp')}</button>
                  <button type="button" className="text-gray-600 hover:underline dark:text-gray-300" onClick={() => moveFaq(index, 1)}>{t('site.moveDown')}</button>
                  <button type="button" className="text-red-600 hover:underline" onClick={() => onChange({ ...form, faqs: faqs.filter((_, itemIndex) => itemIndex !== index) })}>{t('site.remove')}</button>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Input label={`${t('site.faqQuestion')} · ${t('site.turkish')}`} value={item.question_tr} onChange={(event) => setFaq(index, 'question_tr', event.target.value)} fullWidth />
                <Input label={`${t('site.faqQuestion')} · ${t('site.english')}`} value={item.question_en} onChange={(event) => setFaq(index, 'question_en', event.target.value)} fullWidth />
                <TextArea label={`${t('site.faqAnswer')} · ${t('site.turkish')}`} value={item.answer_tr} onChange={(event) => setFaq(index, 'answer_tr', event.target.value)} fullWidth />
                <TextArea label={`${t('site.faqAnswer')} · ${t('site.english')}`} value={item.answer_en} onChange={(event) => setFaq(index, 'answer_en', event.target.value)} fullWidth />
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => onChange({ ...form, faqs: [...faqs, blankFaq()] })}>
            {t('site.addFaq')}
          </Button>
        </div>
      </Card>
    </div>
  );
};
