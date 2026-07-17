-- Check invoices and their business currency
SELECT 
  i.id,
  i.invoice_number,
  i.amount,
  i.status,
  b.name as business_name,
  b.currency as business_currency
FROM invoices i
LEFT JOIN businesses b ON i.business_id = b.id
ORDER BY i.created_at DESC
LIMIT 10;
