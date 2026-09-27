from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.category_repository import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.schemas.common import PaginatedResponse
from app.core.exceptions import NotFoundException
from app.utils.product_images import category_image_url, delete_category_image, save_category_image
from math import ceil
from loguru import logger


class CategoryService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CategoryRepository(db)
    
    def get_category(self, category_id: int) -> CategoryResponse:
        category = self.repo.get_by_id(category_id)
        if not category:
            raise NotFoundException("Category not found")
        return self._response(category)
    
    def _response(self, category) -> CategoryResponse:
        response = CategoryResponse.model_validate(category)
        if category.created_by_user:
            response.created_by_username = category.created_by_user.username
        response.image_url = category_image_url(category.image_filename)
        return response

    def list_categories(
        self,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "id",
        order: str = "asc"
    ) -> PaginatedResponse[CategoryResponse]:
        items, total = self.repo.list_all(page, page_size, sort_by, order)
        responses = []
        for item in items:
            responses.append(self._response(item))
        return PaginatedResponse(
            items=responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=ceil(total / page_size) if total > 0 else 0
        )
    
    def create_category(self, data: CategoryCreate, user_id: int) -> CategoryResponse:
        logger.info(f"Creating category: {data.name} (by user {user_id})")
        category = self.repo.create(data, user_id)
        logger.info(f"Category created successfully - ID: {category.id}, Name: {category.name}")
        return self._response(category)
    
    def update_category(self, category_id: int, data: CategoryUpdate, user_id: int) -> CategoryResponse:
        category = self.repo.get_by_id(category_id)
        if not category:
            raise NotFoundException("Category not found")
        
        category = self.repo.update(category, data, user_id)
        return self._response(category)

    def set_image(self, category_id: int, data: bytes) -> CategoryResponse:
        category = self.repo.get_by_id(category_id)
        if not category:
            raise NotFoundException("Category not found")
        previous = category.image_filename
        category.image_filename = save_category_image(category.id, data)
        self.db.commit()
        self.db.refresh(category)
        if previous and previous != category.image_filename:
            delete_category_image(previous)
        return self._response(category)

    def clear_image(self, category_id: int) -> CategoryResponse:
        category = self.repo.get_by_id(category_id)
        if not category:
            raise NotFoundException("Category not found")
        previous = category.image_filename
        category.image_filename = None
        self.db.commit()
        self.db.refresh(category)
        delete_category_image(previous)
        return self._response(category)
    
    def delete_category(self, category_id: int) -> None:
        category = self.repo.get_by_id(category_id)
        if not category:
            logger.warning(f"Delete failed - Category not found: ID {category_id}")
            raise NotFoundException("Category not found")
        logger.info(f"Deleting category - ID: {category_id}, Name: {category.name}")
        delete_category_image(category.image_filename)
        self.repo.delete(category)
        logger.info(f"Category deleted successfully - ID: {category_id}")
