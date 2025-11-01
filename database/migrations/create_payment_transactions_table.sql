-- ============================================
-- Payment Transactions Table
-- ============================================
-- Stores all payment gateway transactions for audit and reconciliation
-- Created: 2024-11-01
-- For: Datecs/BORICA Payment Gateway Integration

CREATE TABLE IF NOT EXISTS "PaymentTransactions" (
    "TransactionID" SERIAL PRIMARY KEY,
    "OrderID" INTEGER NOT NULL REFERENCES "Orders"("OrderID") ON DELETE CASCADE,
    "TransactionType" VARCHAR(50) NOT NULL, -- 'BORICA_PAYMENT', 'BORICA_REFUND', etc.
    "TransactionStatus" VARCHAR(20) NOT NULL, -- 'SUCCESS', 'FAILED', 'PENDING', 'CANCELLED'
    "Amount" DECIMAL(10, 2), -- Transaction amount
    "Currency" VARCHAR(3) DEFAULT 'BGN', -- Currency code (ISO 4217)
    "PaymentGatewayRef" VARCHAR(100), -- BORICA INT_REF or similar
    "PaymentGatewayResponse" JSONB, -- Full response from payment gateway
    "ResponseCode" VARCHAR(10), -- RC field from BORICA
    "ResponseMessage" TEXT, -- STATUSMSG or error message
    "CardMasked" VARCHAR(20), -- Masked card number (e.g. "5100XXXXXXXX0022")
    "CardBrand" VARCHAR(20), -- Card brand (VISA, Mastercard, etc.)
    "ApprovalCode" VARCHAR(20), -- APPROVAL field from BORICA
    "RRN" VARCHAR(20), -- Retrieval Reference Number
    "TransactionDT" TIMESTAMP NOT NULL DEFAULT NOW(), -- Transaction date/time
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_order_id" ON "PaymentTransactions"("OrderID");
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_status" ON "PaymentTransactions"("TransactionStatus");
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_gateway_ref" ON "PaymentTransactions"("PaymentGatewayRef");
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_transaction_dt" ON "PaymentTransactions"("TransactionDT");

-- Comments
COMMENT ON TABLE "PaymentTransactions" IS 'Stores all payment gateway transactions for audit and reconciliation';
COMMENT ON COLUMN "PaymentTransactions"."OrderID" IS 'Reference to Orders table';
COMMENT ON COLUMN "PaymentTransactions"."TransactionType" IS 'Type of transaction: BORICA_PAYMENT, BORICA_REFUND, etc.';
COMMENT ON COLUMN "PaymentTransactions"."TransactionStatus" IS 'Status: SUCCESS, FAILED, PENDING, CANCELLED';
COMMENT ON COLUMN "PaymentTransactions"."PaymentGatewayRef" IS 'INT_REF from BORICA or reference from other gateways';
COMMENT ON COLUMN "PaymentTransactions"."PaymentGatewayResponse" IS 'Full JSON response from payment gateway for debugging';
COMMENT ON COLUMN "PaymentTransactions"."ResponseCode" IS 'RC field from BORICA (00 = success)';
COMMENT ON COLUMN "PaymentTransactions"."CardMasked" IS 'Masked card number for display (e.g. 5100XXXXXXXX0022)';
COMMENT ON COLUMN "PaymentTransactions"."ApprovalCode" IS 'Bank approval code from BORICA';
COMMENT ON COLUMN "PaymentTransactions"."RRN" IS 'Retrieval Reference Number from BORICA';

-- Trigger to update UpdatedAt timestamp
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."UpdatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_transactions_updated_at
    BEFORE UPDATE ON "PaymentTransactions"
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_transactions_updated_at();

-- Sample queries for testing:
-- 
-- -- Get all successful transactions
-- SELECT * FROM "PaymentTransactions" WHERE "TransactionStatus" = 'SUCCESS' ORDER BY "TransactionDT" DESC;
-- 
-- -- Get transaction details for specific order
-- SELECT 
--     pt.*,
--     o."OrderID",
--     o."TotalAmount",
--     o."OrderStatusID"
-- FROM "PaymentTransactions" pt
-- JOIN "Orders" o ON pt."OrderID" = o."OrderID"
-- WHERE pt."OrderID" = 123;
-- 
-- -- Get payment statistics
-- SELECT 
--     "TransactionStatus",
--     COUNT(*) as "Count",
--     SUM("Amount") as "TotalAmount"
-- FROM "PaymentTransactions"
-- WHERE "TransactionDT" >= NOW() - INTERVAL '7 days'
-- GROUP BY "TransactionStatus";

