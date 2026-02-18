/**
 * BudaBook — VAT-Exclusive Discount Calculator
 *
 * The Philippine VAT rate is 12%. This module computes discounts on the
 * VAT-exclusive portion of a price, following the formula:
 *
 *   discountAmount = (vatInclusiveAmount / 1.12) × (discountPercent / 100)
 *
 * The net amount payable is then: vatInclusiveAmount − discountAmount.
 */

const VAT_MULTIPLIER = 1.12;

/**
 * Calculate a discount on the VAT-exclusive base of a VAT-inclusive amount.
 *
 * @param vatInclusiveAmount - The total amount including 12% VAT
 * @param discountPercent - The discount percentage (e.g. 10 for 10%)
 * @returns discountAmount and netAmount
 */
export function calculateVatExclusiveDiscount(
    vatInclusiveAmount: number,
    discountPercent: number
): { discountAmount: number; netAmount: number } {
    if (discountPercent <= 0 || vatInclusiveAmount <= 0) {
        return { discountAmount: 0, netAmount: vatInclusiveAmount };
    }

    const vatExclusiveBase = vatInclusiveAmount / VAT_MULTIPLIER;
    const discountAmount = Math.round(vatExclusiveBase * (discountPercent / 100) * 100) / 100;
    const netAmount = Math.max(0, vatInclusiveAmount - discountAmount);

    return { discountAmount, netAmount };
}
