import re
from typing import Dict, Any, Optional
from datetime import datetime


class ValidationService:
    def clean_amount(self, value: Any) -> Optional[float]:
        if value is None or value == "":
            return None
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            cleaned = re.sub(r'[^\d.,\-]', '', str(value))
            if re.match(r'^\d{1,3}(\.\d{3})+(,\d+)?$', cleaned):
                cleaned = cleaned.replace('.', '').replace(',', '.')
            elif re.match(r'^\d{1,3}(,\d{3})+(\.\d+)?$', cleaned):
                cleaned = cleaned.replace(',', '')
            elif re.match(r'^\d+,\d{2}$', cleaned):
                cleaned = cleaned.replace(',', '.')
            else:
                cleaned = cleaned.replace(',', '')
            try:
                return round(float(cleaned), 2)
            except ValueError:
                return None
        return None
    
    def clean_date(self, value: Any) -> Optional[str]:
        if not value:
            return None
        value = str(value).strip()
        formats = [
            "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y",
            "%d %b %Y", "%d %B %Y", "%b %d, %Y", "%B %d, %Y",
            "%d-%b-%Y", "%d %b, %Y", "%Y/%m/%d",
        ]
        cleaned = re.sub(r'[^\w\s\-/,.]', '', value)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        for fmt in formats:
            try:
                dt = datetime.strptime(cleaned, fmt)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue
        match = re.search(r'(\d{1,2})[\s\-/](\w+|\d{1,2})[\s\-/,]+(\d{2,4})', cleaned)
        if match:
            day, month_str, year = match.groups()
            try:
                day = int(day)
                if day > 31:
                    day = int(str(day)[-2:]) if day > 99 else int(str(day)[-1:])
                if len(str(year)) == 2:
                    year = 2000 + int(year)
                else:
                    year = int(year)
                month_names = {
                    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
                    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
                }
                month_lower = str(month_str).lower()[:3]
                if month_lower in month_names:
                    month = month_names[month_lower]
                else:
                    month = int(month_str)
                    if month > 12:
                        month = int(str(month)[-1:])
                return f"{year:04d}-{month:02d}-{day:02d}"
            except (ValueError, TypeError):
                pass
        return value
    
    def clean_text(self, value: Any) -> Optional[str]:
        if value is None:
            return None
        return str(value).strip()
    
    def validate_and_fix(self, data: Dict[str, Any], document_type: str) -> Dict[str, Any]:
        if document_type == "invoice":
            return self._validate_invoice(data)
        elif document_type == "receipt":
            return self._validate_receipt(data)
        elif document_type == "contract":
            return self._validate_contract(data)
        return data
    
    def _validate_invoice(self, data):
        for field in ["subtotal", "tax_amount", "total_amount", "tax_rate"]:
            if field in data:
                data[field] = self.clean_amount(data[field])
        for field in ["invoice_date", "due_date"]:
            if field in data:
                data[field] = self.clean_date(data[field])
        if data.get("line_items") and isinstance(data["line_items"], list):
            for item in data["line_items"]:
                if isinstance(item, dict):
                    for amt_field in ["quantity", "unit_price", "amount"]:
                        if amt_field in item:
                            item[amt_field] = self.clean_amount(item[amt_field])
                    if "description" in item:
                        item["description"] = self.clean_text(item["description"])
        
        subtotal = data.get("subtotal")
        tax = data.get("tax_amount")
        total = data.get("total_amount")
        if subtotal and tax and total:
            computed = subtotal + tax
            if abs(computed - total) > 1:
                if abs(computed - total) < max(computed, total) * 0.1:
                    data["total_amount"] = round(computed, 2)
        if not subtotal and data.get("line_items"):
            try:
                computed_subtotal = sum(item.get("amount") or 0 for item in data["line_items"] if isinstance(item, dict))
                if computed_subtotal > 0:
                    data["subtotal"] = round(computed_subtotal, 2)
            except (TypeError, ValueError):
                pass
        if not data.get("tax_rate") and subtotal and tax and subtotal > 0:
            data["tax_rate"] = round((tax / subtotal) * 100, 2)
        for field in ["invoice_number", "vendor_name", "vendor_address", "customer_name",
                      "customer_address", "currency", "payment_terms", "notes"]:
            if field in data:
                data[field] = self.clean_text(data[field])
        return data
    
    def _validate_receipt(self, data):
        for field in ["subtotal", "tax_amount", "total", "tip"]:
            if field in data:
                data[field] = self.clean_amount(data[field])
        if "transaction_date" in data:
            data["transaction_date"] = self.clean_date(data["transaction_date"])
        if data.get("items") and isinstance(data["items"], list):
            for item in data["items"]:
                if isinstance(item, dict):
                    for amt_field in ["quantity", "price", "amount"]:
                        if amt_field in item:
                            item[amt_field] = self.clean_amount(item[amt_field])
        return data
    
    def _validate_contract(self, data):
        for field in ["effective_date", "expiration_date"]:
            if field in data:
                data[field] = self.clean_date(data[field])
        if "total_value" in data:
            data["total_value"] = self.clean_amount(data["total_value"])
        return data


validation_service = ValidationService()