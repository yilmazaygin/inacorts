import csv
import io
from typing import Iterable, Sequence

from fastapi.responses import Response
from openpyxl import Workbook


def _csv_bytes(headers: Sequence[str], rows: Iterable[Sequence]) -> bytes:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)
    return buffer.getvalue().encode("utf-8-sig")


def _xlsx_bytes(headers: Sequence[str], rows: Iterable[Sequence]) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.append(list(headers))
    for row in rows:
        sheet.append(list(row))
    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def spreadsheet_response(filename: str, headers: Sequence[str], rows: Iterable[Sequence], file_format: str) -> Response:
    if file_format == "xlsx":
        content = _xlsx_bytes(headers, rows)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        name = f"{filename}.xlsx"
    else:
        content = _csv_bytes(headers, rows)
        media_type = "text/csv; charset=utf-8"
        name = f"{filename}.csv"
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{name}"'},
    )
