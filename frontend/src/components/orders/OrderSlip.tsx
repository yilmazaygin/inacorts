import React from 'react';
import { useTranslation } from 'react-i18next';
import { useBrand } from '@/contexts/BrandContext';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Customer, Order, Payment } from '@/types/entities';
import { PaymentMethod } from '@/types/enums';

interface OrderSlipProps {
  order: Order;
  customer: Customer;
  payments: Payment[];
  paid: number;
  remaining: number;
}

export const OrderSlip: React.FC<OrderSlipProps> = ({ order, customer, payments, paid, remaining }) => {
  const { t } = useTranslation();
  const brand = useBrand();

  const methodLabel = (method: PaymentMethod) => {
    const labels: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: t('payments.methodCash'),
      [PaymentMethod.BANK_TRANSFER]: t('payments.methodBankTransfer'),
      [PaymentMethod.CREDIT_CARD]: t('payments.methodCreditCard'),
      [PaymentMethod.OTHER]: t('payments.methodOther'),
    };
    return labels[method] || method;
  };

  return (
    <section className="order-slip hidden bg-white p-8 text-black print:block">
      <header className="border-b border-black pb-4">
        <p className="text-xs uppercase tracking-[0.2em]">{brand}</p>
        <h1 className="mt-2 text-2xl font-semibold">{t('orders.printSlip')}</h1>
        <p className="mt-1 text-sm">
          {t('orders.orderNumber')} #{order.id} · {formatDate(order.created_at)}
        </p>
      </header>

      <div className="mt-4 text-sm">
        <p className="font-semibold">{customer.name}</p>
        {customer.address && <p>{customer.address}</p>}
        {customer.phone && <p>{customer.phone}</p>}
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-2 font-medium">{t('common.product')}</th>
            <th className="py-2 text-right font-medium">{t('common.quantity')}</th>
            <th className="py-2 text-right font-medium">{t('common.unitPrice')}</th>
            <th className="py-2 text-right font-medium">{t('common.total')}</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-neutral-300">
              <td className="py-2">{item.product_name || `#${item.product_id}`}</td>
              <td className="py-2 text-right tabular-nums">{item.quantity}</td>
              <td className="py-2 text-right tabular-nums">{formatCurrency(item.unit_price)}</td>
              <td className="py-2 text-right tabular-nums">{formatCurrency(item.quantity * item.unit_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto w-64 text-sm">
        <div className="flex justify-between py-1">
          <span>{t('orders.totalAmount')}</span>
          <span className="font-semibold tabular-nums">{formatCurrency(order.total_amount)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span>{t('payments.paid')}</span>
          <span className="tabular-nums">{formatCurrency(paid)}</span>
        </div>
        <div className="flex justify-between border-t border-black py-1 font-semibold">
          <span>{t('payments.remaining')}</span>
          <span className="tabular-nums">{formatCurrency(remaining)}</span>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="mt-6 text-sm">
          <p className="font-medium">{t('payments.paymentHistory')}</p>
          <ul className="mt-2 space-y-1">
            {payments.map((payment) => (
              <li key={payment.id} className="flex justify-between">
                <span>{formatDate(payment.created_at)} · {methodLabel(payment.method)}</span>
                <span className="tabular-nums">{formatCurrency(payment.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
