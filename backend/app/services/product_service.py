from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.product_repository import ProductRepository
from app.repositories.stock_movement_repository import StockMovementRepository
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.schemas.stock_movement import StockMovementCreate, StockMovementResponse
from app.schemas.common import PaginatedResponse
from app.core.exceptions import NotFoundException, BadRequestException
from app.models import StockMovementType
from app.utils.product_images import (
    MAX_PRODUCT_IMAGES,
    delete_product_image,
    dump_filenames,
    filenames_from,
    image_url_for,
    save_product_image,
)
from math import ceil
from loguru import logger


class ProductService:
    def __init__(self, db: Session):
        self.db = db
        self.product_repo = ProductRepository(db)
        self.stock_repo = StockMovementRepository(db)
    
    def _filenames(self, product) -> list[str]:
        return filenames_from(product.image_filenames, product.image_filename)

    def _store_filenames(self, product, names: list[str]) -> None:
        product.image_filenames = dump_filenames(names)
        product.image_filename = names[0] if names else None

    def _to_response(self, product) -> ProductResponse:
        response = ProductResponse.model_validate(product)
        if product.created_by_user:
            response.created_by_username = product.created_by_user.username
        urls = [url for name in self._filenames(product) if (url := image_url_for(name))]
        response.image_urls = urls
        response.image_url = urls[0] if urls else None
        return response

    def get_product(self, product_id: int) -> ProductResponse:
        product = self.product_repo.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product not found")
        return self._to_response(product)
    
    def list_products(
        self,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "id",
        order: str = "asc",
        search: Optional[str] = None,
        category_id: Optional[int] = None
    ) -> PaginatedResponse[ProductResponse]:
        items, total = self.product_repo.list_all(page, page_size, sort_by, order, search, category_id)
        responses = [self._to_response(item) for item in items]
        return PaginatedResponse(
            items=responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=ceil(total / page_size) if total > 0 else 0
        )
    
    def create_product(self, data: ProductCreate, user_id: int) -> ProductResponse:
        product = self.product_repo.create(data, user_id)
        logger.info(f"Product {product.id} created by user {user_id}")
        return self._to_response(product)
    
    def update_product(self, product_id: int, data: ProductUpdate, user_id: int) -> ProductResponse:
        product = self.product_repo.get_by_id(product_id)
        if not product:
            logger.warning(f"Update failed - Product not found: ID {product_id}")
            raise NotFoundException("Product not found")
        
        logger.info(f"Updating product ID: {product_id} (by user ID: {user_id})")
        product = self.product_repo.update(product, data, user_id)
        logger.info(f"Product updated successfully - ID: {product.id}")
        return self._to_response(product)

    def set_product_image(self, product_id: int, data: bytes, user_id: int) -> ProductResponse:
        product = self.product_repo.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product not found")

        names = self._filenames(product)
        if len(names) >= MAX_PRODUCT_IMAGES:
            raise BadRequestException(f"A product can have at most {MAX_PRODUCT_IMAGES} images")

        filename = save_product_image(product.id, data)
        names.append(filename)
        self._store_filenames(product, names)
        product.updated_by = user_id
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            delete_product_image(filename)
            raise
        self.db.refresh(product)
        logger.info(f"Product image added - ID: {product_id} (by user ID: {user_id})")
        return self._to_response(product)

    def remove_product_image(self, product_id: int, filename: str, user_id: int) -> ProductResponse:
        product = self.product_repo.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product not found")

        names = self._filenames(product)
        if filename not in names:
            raise NotFoundException("Image not found")

        names = [name for name in names if name != filename]
        self._store_filenames(product, names)
        product.updated_by = user_id
        self.db.commit()
        self.db.refresh(product)
        if not self._image_used_elsewhere(product_id, filename):
            delete_product_image(filename)
        logger.info(f"Product image removed - ID: {product_id} (by user ID: {user_id})")
        return self._to_response(product)

    def clear_product_image(self, product_id: int, user_id: int) -> ProductResponse:
        product = self.product_repo.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product not found")

        previous = self._filenames(product)
        self._store_filenames(product, [])
        product.updated_by = user_id
        self.db.commit()
        self.db.refresh(product)
        for filename in previous:
            if not self._image_used_elsewhere(product_id, filename):
                delete_product_image(filename)
        logger.info(f"Product images removed - ID: {product_id} (by user ID: {user_id})")
        return self._to_response(product)

    def _image_used_elsewhere(self, product_id: int, filename: str) -> bool:
        from app.models import Product
        others = self.db.query(Product).filter(Product.id != product_id).all()
        return any(filename in self._filenames(other) for other in others)
    
    def delete_product(self, product_id: int) -> None:
        product = self.product_repo.get_by_id(product_id)
        if not product:
            logger.warning(f"Delete failed - Product not found: ID {product_id}")
            raise NotFoundException("Product not found")
        logger.info(f"Deleting product - ID: {product_id}, Name: {product.name}")
        filenames = self._filenames(product)
        self.product_repo.delete(product)
        for filename in filenames:
            if not self._image_used_elsewhere(product_id, filename):
                delete_product_image(filename)
        logger.info(f"Product deleted successfully - ID: {product_id}")
    
    def adjust_stock(self, data: StockMovementCreate, user_id: int) -> StockMovementResponse:
        product = self.product_repo.get_by_id(data.product_id)
        if not product:
            logger.warning(f"Stock adjustment failed - Product not found: ID {data.product_id}")
            raise NotFoundException("Product not found")
        
        if data.type != StockMovementType.ADJUSTMENT:
            logger.warning(f"Stock adjustment failed - Invalid type: {data.type}")
            raise BadRequestException("Only ADJUSTMENT type is allowed for manual stock changes")
        
        old_stock = product.current_stock
        self.product_repo.update_stock(product, data.quantity)
        movement = self.stock_repo.create(
            product_id=data.product_id,
            quantity=data.quantity,
            movement_type=data.type,
            user_id=user_id
        )
        
        logger.info(f"Stock adjusted for product {data.product_id} ('{product.name}'): {old_stock} -> {product.current_stock} (change: {data.quantity:+d}) by user {user_id}")
        
        return StockMovementResponse.model_validate(movement)
