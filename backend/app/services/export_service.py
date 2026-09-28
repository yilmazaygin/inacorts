from datetime import datetime
from typing import Optional

from sqlalchemy.orm import joinedload

from app.models import (
    Contact,
    Customer,
    Expense,
    Order,
    Payment,
    Product,
    StockMovement,
    StockMovementType,
)
from app.services.expense_service import ExpenseService
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService
from app.services.spreadsheet import spreadsheet_response


class ExportService:
    def __init__(self, db):
        self.db = db

    def export(
        self,
        kind: str,
        file_format: str,
        lang: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ):
        turkish = lang != "en"
        if kind == "orders":
            return OrderService(self.db).export_orders(
                file_format, lang, start_date=start_date, end_date=end_date,
            )
        if kind == "payments":
            return PaymentService(self.db).export_payments(file_format, lang, start_date, end_date)
        if kind == "expenses":
            return ExpenseService(self.db).export_expenses(
                file_format, lang, None, start_date, end_date,
            )
        if kind == "customers":
            return self._customers(file_format, turkish, start_date, end_date)
        if kind == "contacts":
            return self._contacts(file_format, turkish, start_date, end_date)
        if kind == "products":
            return self._products(file_format, turkish, start_date, end_date)
        if kind == "stock":
            return self._stock(file_format, turkish, start_date, end_date)
        return self._financials(file_format, turkish, start_date, end_date)

    def _between(self, query, column, start_date, end_date):
        if start_date:
            query = query.filter(column >= start_date)
        if end_date:
            query = query.filter(column <= end_date)
        return query

    def _when(self, value: Optional[datetime]) -> str:
        return value.strftime("%Y-%m-%d %H:%M") if value else ""

    def _customers(self, file_format, turkish, start_date, end_date):
        query = self.db.query(Customer).options(
            joinedload(Customer.created_by_user),
            joinedload(Customer.contacts),
        )
        rows_src = self._between(query, Customer.created_at, start_date, end_date).order_by(Customer.name.asc()).all()
        headers = (
            ["No", "Ad", "Adres", "Telefon", "E-posta", "Web", "Kişiler", "Kayıt tarihi", "Kayıtlı kişi"]
            if turkish else
            ["No", "Name", "Address", "Phone", "Email", "Website", "Contacts", "Recorded at", "Recorded by"]
        )
        rows = []
        seen = set()
        for customer in rows_src:
            if customer.id in seen:
                continue
            seen.add(customer.id)
            people = ", ".join(contact.name for contact in customer.contacts)
            rows.append([
                customer.id,
                customer.name,
                customer.address or "",
                customer.phone or "",
                customer.email or "",
                customer.website or "",
                people,
                self._when(customer.created_at),
                customer.created_by_user.username if customer.created_by_user else "",
            ])
        return spreadsheet_response("musteriler" if turkish else "customers", headers, rows, file_format)

    def _contacts(self, file_format, turkish, start_date, end_date):
        query = self.db.query(Contact).options(
            joinedload(Contact.created_by_user),
            joinedload(Contact.customers),
        )
        rows_src = self._between(query, Contact.created_at, start_date, end_date).order_by(Contact.name.asc()).all()
        headers = (
            ["No", "Ad", "Telefon", "E-posta", "Web", "Müşteriler", "Kayıt tarihi", "Kayıtlı kişi"]
            if turkish else
            ["No", "Name", "Phone", "Email", "Website", "Customers", "Recorded at", "Recorded by"]
        )
        rows = []
        seen = set()
        for contact in rows_src:
            if contact.id in seen:
                continue
            seen.add(contact.id)
            names = ", ".join(customer.name for customer in contact.customers)
            rows.append([
                contact.id,
                contact.name,
                contact.phone or "",
                contact.email or "",
                contact.website or "",
                names,
                self._when(contact.created_at),
                contact.created_by_user.username if contact.created_by_user else "",
            ])
        return spreadsheet_response("kisiler" if turkish else "contacts", headers, rows, file_format)

    def _products(self, file_format, turkish, start_date, end_date):
        query = self.db.query(Product).options(
            joinedload(Product.category),
            joinedload(Product.created_by_user),
        )
        rows_src = self._between(query, Product.created_at, start_date, end_date).order_by(Product.name.asc()).all()
        yes = "Evet" if turkish else "Yes"
        no = "Hayır" if turkish else "No"
        headers = (
            ["No", "Stok kodu", "Ad", "Kategori", "Liste fiyatı", "Stok", "Sitede", "Kayıt tarihi", "Kayıtlı kişi"]
            if turkish else
            ["No", "Stock code", "Name", "Category", "List price", "Stock", "On site", "Recorded at", "Recorded by"]
        )
        rows = [
            [
                product.id,
                product.sku or "",
                product.name,
                product.category.name if product.category else "",
                product.list_price,
                product.current_stock,
                yes if product.show_on_site else no,
                self._when(product.created_at),
                product.created_by_user.username if product.created_by_user else "",
            ]
            for product in rows_src
        ]
        return spreadsheet_response("urunler" if turkish else "products", headers, rows, file_format)

    def _stock(self, file_format, turkish, start_date, end_date):
        query = self.db.query(StockMovement).options(
            joinedload(StockMovement.product),
            joinedload(StockMovement.performed_by_user),
        )
        rows_src = self._between(query, StockMovement.created_at, start_date, end_date).order_by(StockMovement.created_at.desc()).all()
        labels = {
            StockMovementType.IN: "Giriş" if turkish else "In",
            StockMovementType.OUT: "Çıkış" if turkish else "Out",
            StockMovementType.ADJUSTMENT: "Düzeltme" if turkish else "Adjustment",
        }
        headers = (
            ["No", "Tarih", "Ürün", "Tür", "Miktar", "Sebep", "Sipariş", "Yapan"]
            if turkish else
            ["No", "Date", "Product", "Type", "Quantity", "Reason", "Order", "By"]
        )
        rows = [
            [
                movement.id,
                self._when(movement.created_at),
                movement.product.name if movement.product else movement.product_id,
                labels.get(movement.type, movement.type.value),
                movement.quantity,
                movement.reason or "",
                movement.related_order_id or "",
                movement.performed_by_user.username if movement.performed_by_user else "",
            ]
            for movement in rows_src
        ]
        return spreadsheet_response("stok" if turkish else "stock", headers, rows, file_format)

    def _financials(self, file_format, turkish, start_date, end_date):
        payments = self._between(
            self.db.query(Payment).options(joinedload(Payment.order).joinedload(Order.customer)),
            Payment.created_at,
            start_date,
            end_date,
        ).all()
        expenses = self._between(
            self.db.query(Expense).options(joinedload(Expense.category)),
            Expense.date,
            start_date,
            end_date,
        ).all()
        income_label = "Tahsilat" if turkish else "Payment"
        expense_label = "Masraf" if turkish else "Expense"
        entries = []
        for payment in payments:
            customer = ""
            if payment.order and payment.order.customer:
                customer = payment.order.customer.name
            detail = f"#{payment.order_id}"
            if customer:
                detail = f"{detail} — {customer}"
            entries.append((payment.created_at, income_label, detail, payment.amount, 0))
        for expense in expenses:
            category = expense.category.name if expense.category else ""
            detail = expense.description or ""
            if category:
                detail = f"{category} — {detail}" if detail else category
            entries.append((expense.date, expense_label, detail, 0, expense.amount))
        entries.sort(key=lambda row: row[0] or datetime.min)
        headers = (
            ["Tarih", "Tür", "Açıklama", "Giriş", "Çıkış", "Bakiye"]
            if turkish else
            ["Date", "Type", "Description", "In", "Out", "Balance"]
        )
        balance = 0.0
        rows = []
        for moment, kind, detail, incoming, outgoing in entries:
            balance = round(balance + float(incoming or 0) - float(outgoing or 0), 2)
            rows.append([
                moment.strftime("%Y-%m-%d") if moment else "",
                kind,
                detail,
                incoming or "",
                outgoing or "",
                balance,
            ])
        return spreadsheet_response("maddi-gecmis" if turkish else "financial-history", headers, rows, file_format)
