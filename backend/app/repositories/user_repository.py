from typing import Optional, List
from sqlalchemy.orm import Session
from app.models import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()
    
    def create(self, username: str, hashed_password: str, is_admin: bool = False) -> User:
        user = User(
            username=username,
            hashed_password=hashed_password,
            is_admin=is_admin,
            is_active=True
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def list_all(self) -> List[User]:
        return self.db.query(User).all()
