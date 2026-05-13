from io import BytesIO, StringIO
import csv
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_LEFT

from app.api.deps import CurrentUser

router = APIRouter()


# Register Roboto font for Cyrillic support
try:
    pdfmetrics.registerFont(TTFont("Roboto", "/app/backend/app/static/fonts/Roboto-Regular.ttf"))
except Exception:
    pass


class ExportRequest(BaseModel):
    data: list[dict]


def generate_pdf(title: str, columns: list[str], data: list[dict]) -> BytesIO:
    """Generate PDF from data"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=15*mm, bottomMargin=15*mm)

    title_style = ParagraphStyle(
        "Title",
        fontName="Roboto",
        fontSize=14,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=12,
    )
    custom_style = ParagraphStyle(
        "CustomStyle",
        fontName="Roboto",
        fontSize=9,
        alignment=TA_LEFT,
        textColor=colors.black,
    )

    story = []
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 0.3*inch))

    # Extract column labels from data keys
    if not data:
        story.append(Paragraph("Нет данных", custom_style))
    else:
        # Build table
        header = list(data[0].keys()) if data else columns
        table_data = [header]

        for row in data:
            table_row = [str(row.get(col, "—")) for col in header]
            table_data.append(table_row)

        # Calculate column widths
        num_cols = len(header)
        col_width = 6.5*inch / num_cols if num_cols > 0 else 1*inch

        table = Table(table_data, colWidths=[col_width] * num_cols)
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Roboto"),
                    ("FONTSIZE", (0, 0), (-1, 0), 9),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                    ("TOPPADDING", (0, 0), (-1, 0), 8),
                    ("GRID", (0, 0), (-1, -1), 1, colors.grey),
                    ("FONTNAME", (0, 1), (-1, -1), "Roboto"),
                    ("FONTSIZE", (0, 1), (-1, -1), 8),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                    ("TOPPADDING", (0, 1), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
                ]
            )
        )

        story.append(table)

    # Add metadata
    story.append(Spacer(1, 0.2*inch))
    date_str = datetime.now().strftime("%d.%m.%Y")
    story.append(Paragraph(f"Дата выгрузки: {date_str} | Записей: {len(data)}", custom_style))

    doc.build(story)
    buffer.seek(0)
    return buffer


@router.post("/export/users-pdf")
async def export_users_pdf(
    current_user: CurrentUser,
    request: ExportRequest,
    title: str = Query("Пользователи"),
):
    """Export users as PDF"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized")

    print(f"DEBUG: received data: {request.data}")
    pdf_buffer = generate_pdf(title, list(request.data[0].keys()) if request.data else [], request.data)
    pdf_data = pdf_buffer.getvalue()
    filename = f"users-{datetime.now().strftime('%Y-%m-%d')}.pdf"

    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/export/admission-requests-pdf")
async def export_admission_requests_pdf(
    current_user: CurrentUser,
    request: ExportRequest,
    title: str = Query("Заявки на обучение"),
):
    """Export admission requests as PDF"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized")

    pdf_buffer = generate_pdf(title, list(request.data[0].keys()) if request.data else [], request.data)
    pdf_data = pdf_buffer.getvalue()
    filename = f"admission-requests-{datetime.now().strftime('%Y-%m-%d')}.pdf"

    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/export/programs-pdf")
async def export_programs_pdf(
    current_user: CurrentUser,
    request: ExportRequest,
    title: str = Query("Программы"),
):
    """Export programs as PDF"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized")

    pdf_buffer = generate_pdf(title, list(request.data[0].keys()) if request.data else [], request.data)
    pdf_data = pdf_buffer.getvalue()
    filename = f"programs-{datetime.now().strftime('%Y-%m-%d')}.pdf"

    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


def generate_csv(data: list[dict]) -> str:
    """Generate CSV from data"""
    if not data:
        return ""

    output = StringIO()
    fieldnames = list(data[0].keys())
    writer = csv.DictWriter(output, fieldnames=fieldnames)

    writer.writeheader()
    for row in data:
        writer.writerow(row)

    return output.getvalue()


@router.post("/export/users-csv")
async def export_users_csv(
    current_user: CurrentUser,
    request: ExportRequest,
):
    """Export users as CSV"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized")

    csv_content = generate_csv(request.data)
    filename = f"users-{datetime.now().strftime('%Y-%m-%d')}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/export/admission-requests-csv")
async def export_admission_requests_csv(
    current_user: CurrentUser,
    request: ExportRequest,
):
    """Export admission requests as CSV"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized")

    csv_content = generate_csv(request.data)
    filename = f"admission-requests-{datetime.now().strftime('%Y-%m-%d')}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/export/programs-csv")
async def export_programs_csv(
    current_user: CurrentUser,
    request: ExportRequest,
):
    """Export programs as CSV"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized")

    csv_content = generate_csv(request.data)
    filename = f"programs-{datetime.now().strftime('%Y-%m-%d')}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
