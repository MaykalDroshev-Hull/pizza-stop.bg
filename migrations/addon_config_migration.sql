-- ============================================================
-- Migration: Addon Configuration System
-- Purpose: Add AddonType, IsDisabled, SortOrder to Addon table
--          Create LkProductAddon for per-product addon assignment
-- ============================================================

-- 1. Add new columns to Addon table
ALTER TABLE public."Addon"
  ADD COLUMN IF NOT EXISTS "AddonType" text NOT NULL DEFAULT 'sauce',
  ADD COLUMN IF NOT EXISTS "IsDisabled" smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "SortOrder" integer NOT NULL DEFAULT 0;

-- 2. Populate AddonType based on existing ID ranges
-- Small pizza meats (800-899)
UPDATE public."Addon" SET "AddonType" = 'meat' WHERE "AddonID" >= 800 AND "AddonID" <= 899;
-- Small pizza cheeses (700-799)
UPDATE public."Addon" SET "AddonType" = 'cheese' WHERE "AddonID" >= 700 AND "AddonID" <= 799;
-- Small pizza addons (600-699)
UPDATE public."Addon" SET "AddonType" = 'pizza-addon' WHERE "AddonID" >= 600 AND "AddonID" <= 699;

-- Large pizza meats (8000-8999)
UPDATE public."Addon" SET "AddonType" = 'meat' WHERE "AddonID" >= 8000 AND "AddonID" <= 8999;
-- Large pizza cheeses (7000-7999)
UPDATE public."Addon" SET "AddonType" = 'cheese' WHERE "AddonID" >= 7000 AND "AddonID" <= 7999;
-- Large pizza addons (6000-6999)
UPDATE public."Addon" SET "AddonType" = 'pizza-addon' WHERE "AddonID" >= 6000 AND "AddonID" <= 6999;

-- Sauces (ProductTypeID = 5)
UPDATE public."Addon" SET "AddonType" = 'sauce' WHERE "ProductTypeID" = 5;
-- Vegetables (ProductTypeID = 6)
UPDATE public."Addon" SET "AddonType" = 'vegetable' WHERE "ProductTypeID" = 6;

-- 3. Create LkProductAddon table for per-product addon assignment
CREATE TABLE IF NOT EXISTS public."LkProductAddon" (
  "ProductID" bigint NOT NULL,
  "AddonID" integer NOT NULL,
  CONSTRAINT "LkProductAddon_pkey" PRIMARY KEY ("ProductID", "AddonID"),
  CONSTRAINT "fk_lkproductaddon_product" FOREIGN KEY ("ProductID") REFERENCES public."Product"("ProductID") ON DELETE CASCADE,
  CONSTRAINT "fk_lkproductaddon_addon" FOREIGN KEY ("AddonID") REFERENCES public."Addon"("AddonID") ON DELETE CASCADE
);

-- 4. Create index for fast lookups
CREATE INDEX IF NOT EXISTS "idx_lkproductaddon_addonid" ON public."LkProductAddon" ("AddonID");
CREATE INDEX IF NOT EXISTS "idx_lkproductaddon_productid" ON public."LkProductAddon" ("ProductID");
CREATE INDEX IF NOT EXISTS "idx_addon_addontype" ON public."Addon" ("AddonType");
CREATE INDEX IF NOT EXISTS "idx_addon_isdisabled" ON public."Addon" ("IsDisabled");

-- 5. Add SizeCategory column for pizza addon size differentiation
-- 'small' = малка пица добавки (formerly ID 600-899)
-- 'large' = голяма пица добавки (formerly ID 6000-8999)
-- NULL = non-pizza addons (sauces, vegetables, etc.)
ALTER TABLE public."Addon" ADD COLUMN IF NOT EXISTS "SizeCategory" text;

-- Populate SizeCategory based on existing ID ranges
UPDATE public."Addon" SET "SizeCategory" = 'small' WHERE "AddonID" >= 600 AND "AddonID" <= 899;
UPDATE public."Addon" SET "SizeCategory" = 'large' WHERE "AddonID" >= 6000 AND "AddonID" <= 8999;

-- Index for SizeCategory lookups
CREATE INDEX IF NOT EXISTS "idx_addon_sizecategory" ON public."Addon" ("SizeCategory");
