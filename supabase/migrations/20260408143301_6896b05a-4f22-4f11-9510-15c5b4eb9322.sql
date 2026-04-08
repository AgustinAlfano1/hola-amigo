
ALTER TABLE public.products ADD COLUMN stock_quantity integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN codigo varchar(50) DEFAULT NULL;

-- Migrate existing in_stock data: set stock_quantity to 1 where in_stock is true
UPDATE public.products SET stock_quantity = CASE WHEN in_stock = true THEN 1 ELSE 0 END;
