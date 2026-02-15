from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from app.models import Customer, Contact
from app.schemas.customer import CustomerCreate, CustomerUpdate


class CustomerRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, customer_id: int) -> Optional[Customer]:
        return (
            self.db.query(Customer)
            .options(joinedload(Customer.created_by_user), joinedload(Customer.contacts))
            .filter(Customer.id == customer_id)
            .first()
        )
    
    def list_all(
        self,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "id",
        order: str = "asc",
        search: Optional[str] = None
    ) -> Tuple[List[Customer], int]:
        query = self.db.query(Customer).options(joinedload(Customer.created_by_user))
        
        if search:
            query = query.filter(
                or_(
                    Customer.name.ilike(f"%{search}%"),
                    Customer.email.ilike(f"%{search}%"),
                    Customer.phone.ilike(f"%{search}%")
                )
            )
        
        total = query.count()
        
        if hasattr(Customer, sort_by):
            column = getattr(Customer, sort_by)
            if order == "desc":
                query = query.order_by(column.desc())
            else:
                query = query.order_by(column.asc())
        
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        
        return items, total
    
    def create(self, data: CustomerCreate, user_id: int) -> Customer:
        customer_dict = data.model_dump(exclude={"contact_ids"})
        customer = Customer(
            **customer_dict,
            created_by=user_id,
            updated_by=user_id
        )
        
        if data.contact_ids:
            contacts = self.db.query(Contact).filter(Contact.id.in_(data.contact_ids)).all()
            customer.contacts = contacts
        
        self.db.add(customer)
        self.db.commit()
        self.db.refresh(customer)
        return customer
    
    def update(self, customer: Customer, data: CustomerUpdate, user_id: int) -> Customer:
        update_data = data.model_dump(exclude_unset=True, exclude={"contact_ids"})
        for key, value in update_data.items():
            setattr(customer, key, value)
        
        if data.contact_ids is not None:
            contacts = self.db.query(Contact).filter(Contact.id.in_(data.contact_ids)).all()
            customer.contacts = contacts
        
        customer.updated_by = user_id
        self.db.commit()
        self.db.refresh(customer)
        return customer
    
    def delete(self, customer: Customer) -> None:
        self.db.delete(customer)
        self.db.commit()
