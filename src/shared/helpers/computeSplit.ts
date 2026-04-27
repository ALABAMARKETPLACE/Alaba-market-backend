export interface SplitResult {
  product_amount_kobo: number;
  delivery_amount_kobo: number;
  tax_amount_kobo: number;
  discount_kobo: number;
  seller_fee_surcharge_kobo: number;
  admin_amount_kobo: number;
  seller_amount_kobo: number;
  admin_percentage: number;
  seller_percentage: number;
}

/**
 * Compute split amounts using integer kobo arithmetic to avoid floats.
 * Returns all amounts in kobo (integers) and percentages.
 */
export function computeSplit({
  product_total_kobo,
  delivery_kobo = 0,
  tax_kobo = 0,
  discount_kobo = 0,
  admin_percentage = 5,
  seller_fee_surcharge_kobo = 0,
}: {
  product_total_kobo: number;
  delivery_kobo?: number;
  tax_kobo?: number;
  discount_kobo?: number;
  admin_percentage?: number;
  seller_fee_surcharge_kobo?: number;
}): SplitResult {
  if (
    product_total_kobo < 0 ||
    delivery_kobo < 0 ||
    tax_kobo < 0 ||
    discount_kobo < 0 ||
    seller_fee_surcharge_kobo < 0
  ) {
    throw new Error("Amounts must be non-negative");
  }

  const product_amount_kobo = Math.max(0, product_total_kobo - discount_kobo);

  // admin's cut on product only
  const admin_cut_on_product = Math.round(
    (product_amount_kobo * admin_percentage) / 100,
  );
  const normalizedSellerFeeSurchargeKobo = Math.min(
    product_amount_kobo - admin_cut_on_product,
    Math.round(seller_fee_surcharge_kobo),
  );

  const admin_amount_kobo =
    admin_cut_on_product +
    delivery_kobo +
    tax_kobo +
    normalizedSellerFeeSurchargeKobo;
  const seller_amount_kobo =
    product_amount_kobo -
    admin_cut_on_product -
    normalizedSellerFeeSurchargeKobo;

  return {
    product_amount_kobo,
    delivery_amount_kobo: delivery_kobo,
    tax_amount_kobo: tax_kobo,
    discount_kobo,
    seller_fee_surcharge_kobo: normalizedSellerFeeSurchargeKobo,
    admin_amount_kobo,
    seller_amount_kobo,
    admin_percentage,
    seller_percentage: 100 - admin_percentage,
  };
}

export default computeSplit;
