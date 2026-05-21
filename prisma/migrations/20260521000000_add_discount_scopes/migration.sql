-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DiscountType') THEN
        CREATE TYPE "DiscountType" AS ENUM ('percentage', 'fixed');
    END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DiscountScope') THEN
        CREATE TYPE "DiscountScope" AS ENUM ('all', 'product', 'category', 'brand');
    END IF;
END $$;

-- CreateTable
CREATE TABLE "product_discounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "scope" "DiscountScope" NOT NULL DEFAULT 'product',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_products" (
    "discount_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,

    CONSTRAINT "discount_products_pkey" PRIMARY KEY ("discount_id","product_id")
);

-- CreateTable
CREATE TABLE "discount_categories" (
    "discount_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "discount_categories_pkey" PRIMARY KEY ("discount_id","category_id")
);

-- CreateTable
CREATE TABLE "discount_brands" (
    "discount_id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,

    CONSTRAINT "discount_brands_pkey" PRIMARY KEY ("discount_id","brand_id")
);

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "product_discounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_products" ADD CONSTRAINT "discount_products_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "product_discounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_products" ADD CONSTRAINT "discount_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_categories" ADD CONSTRAINT "discount_categories_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "product_discounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_categories" ADD CONSTRAINT "discount_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_brands" ADD CONSTRAINT "discount_brands_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "product_discounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_brands" ADD CONSTRAINT "discount_brands_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
