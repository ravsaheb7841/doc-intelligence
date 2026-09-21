"""Prompt templates for document extraction"""

# ============ INVOICE ============

INVOICE_SYSTEM = """You are an expert invoice data extraction assistant with deep OCR error correction skills.

CRITICAL RULES:
1. The input text comes from OCR and may contain errors
2. Common OCR errors to fix:
   - Numbers: "899,00" to "899.00" (comma to dot)
   - Dates: "318 May 2023" to "18 May 2023" (remove extra digit)
   - Currency: "S" to "$", "E" to "EUR"
   - Letters vs Numbers: "0"/"O", "1"/"l"/"I"
3. Use CONTEXT to infer correct values
4. Return ONLY valid JSON
5. Do NOT invent data - use null for missing fields

VERIFICATION:
- subtotal + tax_amount = total_amount (within 1%)
- sum of line_items = subtotal
- invoice_date should be before due_date"""

INVOICE_USER = """Extract ALL fields from this OCR-extracted invoice text. Be EXHAUSTIVE - do not skip any field.

OCR CLEANING:
- Amounts: "899,00" to "899.00"
- Dates: "318 May 2023" to "18 May 2023"
- Verify: Subtotal + Tax = Total

CRITICAL RULES:
1. Extract EVERY field even if partially visible
2. For addresses, include ALL lines (street, city, state, zip, country)
3. For line items, include FULL description (may span multiple lines)
4. If text is broken across lines, JOIN it
5. Do NOT leave fields null if any text exists
6. Do NOT truncate long text

FIELDS TO EXTRACT:
- invoice_number (full, may include prefix like INV-)
- invoice_date, due_date (YYYY-MM-DD format)
- vendor_name, vendor_address (FULL multi-line), vendor_email, vendor_phone
- customer_name (with title like Ms./Mr.), customer_address (FULL), customer_email
- line_items: ARRAY of ALL items with description, quantity, unit_price, amount
- subtotal, tax_rate, tax_amount, total_amount, currency
- payment_terms (full text)
- notes (any additional text)

Return ONLY valid JSON in this EXACT structure:
{{
  "invoice_number": null,
  "invoice_date": null,
  "due_date": null,
  "vendor_name": null,
  "vendor_address": null,
  "vendor_email": null,
  "vendor_phone": null,
  "customer_name": null,
  "customer_address": null,
  "customer_email": null,
  "line_items": [],
  "subtotal": null,
  "tax_rate": null,
  "tax_amount": null,
  "total_amount": null,
  "currency": null,
  "payment_terms": null,
  "notes": null
}}

INVOICE TEXT:
__TEXT__

Return only JSON. Fill EVERY field you can find."""


# ============ CONTRACT ============

CONTRACT_SYSTEM = """You are an expert contract analysis assistant.
Extract key terms and clauses from contract text with high accuracy.
Always return valid JSON. If a field is not found, use null."""

CONTRACT_USER = """Extract the following fields from this contract text:

FIELDS TO EXTRACT:
- contract_type, contract_title
- effective_date, expiration_date (YYYY-MM-DD format)
- party_1_name, party_1_role, party_2_name, party_2_role
- total_value, currency, payment_terms
- termination_clause, confidentiality, governing_law
- key_obligations: array of strings
- signatures: array of objects

Return ONLY valid JSON:
{{
  "contract_type": null,
  "contract_title": null,
  "effective_date": null,
  "expiration_date": null,
  "party_1_name": null,
  "party_1_role": null,
  "party_2_name": null,
  "party_2_role": null,
  "total_value": null,
  "currency": null,
  "payment_terms": null,
  "termination_clause": null,
  "confidentiality": null,
  "governing_law": null,
  "key_obligations": [],
  "signatures": []
}}

CONTRACT TEXT:
__TEXT__

Return only JSON."""


# ============ RECEIPT ============

RECEIPT_SYSTEM = """You are an expert receipt extraction assistant.
Extract structured data from receipt text with high accuracy.
Always return valid JSON."""

RECEIPT_USER = """Extract the following fields from this receipt text:

FIELDS TO EXTRACT:
- merchant_name, merchant_address, merchant_phone
- receipt_number, transaction_date, transaction_time
- items: array of objects with name, quantity, price
- subtotal, tax_amount, tip, total
- payment_method, card_last_4, currency

Return ONLY valid JSON:
{{
  "merchant_name": null,
  "merchant_address": null,
  "merchant_phone": null,
  "receipt_number": null,
  "transaction_date": null,
  "transaction_time": null,
  "items": [],
  "subtotal": null,
  "tax_amount": null,
  "tip": null,
  "total": null,
  "payment_method": null,
  "card_last_4": null,
  "currency": null
}}

RECEIPT TEXT:
__TEXT__

Return only JSON."""


# ============ CLASSIFIER ============

CLASSIFIER_SYSTEM = """You are a document type classifier.
Classify documents into exactly one category.
Return only JSON."""

CLASSIFIER_USER = """Classify this document into ONE of these types:
- invoice
- contract
- receipt
- purchase_order
- bank_statement
- resume
- report
- letter
- form
- other

DOCUMENT TEXT (first 2000 chars):
__TEXT__

Return JSON:
{{
  "document_type": "invoice",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}}"""


# ============ GENERIC ============

GENERIC_SYSTEM = """You are a document analysis assistant.
Extract key information from any document.
Return valid JSON with fields you can identify."""

GENERIC_USER = """Analyze this document and extract key fields.

Return JSON with:
- document_type: What kind of document is it
- summary: 1-2 sentence summary
- key_fields: Object with any important fields you find (dates, amounts, names, IDs, addresses)
- entities: Array of objects with name, value, type

DOCUMENT TEXT:
__TEXT__

Return only JSON."""


# ============ HELPER FUNCTIONS ============

def get_extraction_prompt(document_type: str, text: str):
    """Get system and user prompts for document type using safe replace"""
    text = text[:8000]  # Limit to avoid token overflow
    
    prompts = {
        "invoice": (INVOICE_SYSTEM, INVOICE_USER),
        "contract": (CONTRACT_SYSTEM, CONTRACT_USER),
        "receipt": (RECEIPT_SYSTEM, RECEIPT_USER),
    }
    
    system, user_template = prompts.get(
        document_type,
        (GENERIC_SYSTEM, GENERIC_USER)
    )
    
    # Use .replace() instead of .format() to avoid brace conflicts
    user_prompt = user_template.replace("__TEXT__", text)
    
    return (system, user_prompt)


def get_classifier_prompt(text: str):
    """Get document type classifier prompt"""
    text = text[:2000]
    user_prompt = CLASSIFIER_USER.replace("__TEXT__", text)
    return (CLASSIFIER_SYSTEM, user_prompt)