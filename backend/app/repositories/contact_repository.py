from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.models import Contact, Customer
from app.schemas.contact import ContactCreate, ContactUpdate


class ContactRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, contact_id: int) -> Optional[Contact]:
        return (
            self.db.query(Contact)
            .options(joinedload(Contact.created_by_user), joinedload(Contact.customers))
            .filter(Contact.id == contact_id)
            .first()
        )
    
    def list_all(
        self,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "id",
        order: str = "asc",
        search: Optional[str] = None
    ) -> Tuple[List[Contact], int]:
        query = self.db.query(Contact).options(joinedload(Contact.created_by_user), joinedload(Contact.customers))
        
        if search:
            query = query.filter(
                or_(
                    Contact.name.ilike(f"%{search}%"),
                    Contact.email.ilike(f"%{search}%"),
                    Contact.phone.ilike(f"%{search}%")
                )
            )
        
        total = query.count()
        
        if hasattr(Contact, sort_by):
            column = getattr(Contact, sort_by)
            if order == "desc":
                query = query.order_by(column.desc())
            else:
                query = query.order_by(column.asc())
        
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        
        return items, total
    
    def create(self, data: ContactCreate, user_id: int) -> Contact:
        contact_dict = data.model_dump(exclude={"customer_ids"})
        contact = Contact(
            **contact_dict,
            created_by=user_id,
            updated_by=user_id
        )
        
        if data.customer_ids:
            customers = self.db.query(Customer).filter(Customer.id.in_(data.customer_ids)).all()
            contact.customers = customers
        
        self.db.add(contact)
        self.db.commit()
        self.db.refresh(contact)
        return contact
    
    def update(self, contact: Contact, data: ContactUpdate, user_id: int) -> Contact:
        update_data = data.model_dump(exclude_unset=True, exclude={"customer_ids"})
        for key, value in update_data.items():
            setattr(contact, key, value)
        
        if data.customer_ids is not None:
            customers = self.db.query(Customer).filter(Customer.id.in_(data.customer_ids)).all()
            contact.customers = customers
        
        contact.updated_by = user_id
        self.db.commit()
        self.db.refresh(contact)
        return contact
    
    def delete(self, contact: Contact) -> None:
        self.db.delete(contact)
        self.db.commit()
