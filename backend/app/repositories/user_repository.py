from typing import Optional, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()
    
    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()
    
    def create(self, username: str, hashed_password: str, is_admin: bool = False,
               email: Optional[str] = None, created_by: Optional[int] = None,
               name: Optional[str] = None, surname: Optional[str] = None,
               address: Optional[str] = None, backup_email: Optional[str] = None,
               phone_number: Optional[str] = None) -> User:
        user = User(
            username=username,
            hashed_password=hashed_password,
            email=email,
            is_admin=is_admin,
            is_active=True,
            created_by=created_by,
            name=name,
            surname=surname,
            address=address,
            backup_email=backup_email,
            phone_number=phone_number
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def list_all(self, page: int = 1, page_size: int = 20,
                 search: Optional[str] = None) -> Tuple[List[User], int]:
        query = self.db.query(User)
        
        if search:
            query = query.filter(User.username.ilike(f"%{search}%"))
        
        total = query.count()
        items = query.order_by(User.id).offset((page - 1) * page_size).limit(page_size).all()
        return items, total
    
    def update(self, user: User, **kwargs) -> User:
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def deactivate(self, user: User) -> User:
        user.is_active = False
        user.deactivated_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def set_security_questions(self, user: User, question_1: str, answer_1_hash: str,
                                question_2: str, answer_2_hash: str) -> User:
        user.security_question_1 = question_1
        user.security_answer_1_hash = answer_1_hash
        user.security_question_2 = question_2
        user.security_answer_2_hash = answer_2_hash
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def update_password(self, user: User, hashed_password: str) -> User:
        user.hashed_password = hashed_password
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        return user
