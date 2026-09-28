from datetime import datetime
from typing import Optional

from app.models import TagEntityType, TagLink


def restrict_records(
    query,
    model,
    created_by: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    tag_id: Optional[int] = None,
    tag_type: Optional[TagEntityType] = None,
):
    if created_by:
        query = query.filter(model.created_by == created_by)
    if start_date:
        query = query.filter(model.created_at >= start_date)
    if end_date:
        query = query.filter(model.created_at <= end_date)
    if tag_id and tag_type is not None:
        linked_ids = query.session.query(TagLink.entity_id).filter(
            TagLink.tag_id == tag_id,
            TagLink.entity_type == tag_type,
        )
        query = query.filter(model.id.in_(linked_ids))
    return query
