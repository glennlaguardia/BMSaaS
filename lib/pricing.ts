import { addDays, isWeekend, parseISO, format } from 'date-fns';
import type { AccommodationType, RateAdjustment, Addon, NightBreakdown, PriceCalculation } from '@/types';

/**
 * BudaBook Pricing Engine
 * 
 * Supports multi-night stays. Each night is priced individually:
 * 1. Determine if the night is weekday or weekend
 * 2. Apply the base rate (weekday/weekend) for the accommodation type
 * 3. Apply any active rate adjustments for that specific date
 * 4. Sum all nights
 * 
 * Pax surcharge is per-night (extra_pax * additional_pax_fee * num_nights).
 * Add-ons are per-stay (not per-night).
 */

/**
 * Calculate the breakdown for each night in a date range.
 */
export function calculateNightBreakdowns(
  checkIn: string,
  checkOut: string,
  accommodationType: AccommodationType,
  rateAdjustments: RateAdjustment[]
): NightBreakdown[] {
  const nights: NightBreakdown[] = [];
  const startDate = parseISO(checkIn);
  const endDate = parseISO(checkOut);

  let currentDate = startDate;
  while (currentDate < endDate) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayOfWeek = currentDate.getDay();
    const isWknd = isWeekend(currentDate);
    const baseRate = isWknd
      ? accommodationType.base_rate_weekend
      : accommodationType.base_rate_weekday;

    // Find active rate adjustment for this date
    let adjustmentName: string | null = null;
    let adjustmentAmount = 0;
    let effectiveRate = baseRate;

    const applicableAdjustment = rateAdjustments.find((adj) => {
      if (!adj.is_active) return false;
      if (dateStr < adj.start_date || dateStr > adj.end_date) return false;
      if (adj.applies_to === 'specific') {
        const typeIds = adj.accommodation_type_ids as string[];
        if (!typeIds.includes(accommodationType.id)) return false;
      }
      return true;
    });

    if (applicableAdjustment) {
      adjustmentName = applicableAdjustment.name;
      switch (applicableAdjustment.adjustment_type) {
        case 'percentage_discount':
          adjustmentAmount = -(baseRate * (applicableAdjustment.adjustment_value / 100));
          effectiveRate = baseRate + adjustmentAmount;
          break;
        case 'percentage_surcharge':
          adjustmentAmount = baseRate * (applicableAdjustment.adjustment_value / 100);
          effectiveRate = baseRate + adjustmentAmount;
          break;
        case 'fixed_override':
          adjustmentAmount = applicableAdjustment.adjustment_value - baseRate;
          effectiveRate = applicableAdjustment.adjustment_value;
          break;
      }
    }

    nights.push({
      date: dateStr,
      dayOfWeek,
      isWeekend: isWknd,
      baseRate,
      adjustmentName,
      adjustmentAmount,
      effectiveRate: Math.max(0, effectiveRate),
    });

    currentDate = addDays(currentDate, 1);
  }

  return nights;
}

/**
 * Full price calculation for an overnight booking.
 */
export function calculatePrice(
  checkIn: string,
  checkOut: string,
  numAdults: number,
  numChildren: number,
  accommodationType: AccommodationType,
  rateAdjustments: RateAdjustment[],
  selectedAddons: { addon: Addon; quantity: number }[] = []
): PriceCalculation {
  const nights = calculateNightBreakdowns(checkIn, checkOut, accommodationType, rateAdjustments);
  const totalNights = nights.length;

  // Base rate = sum of all nightly effective rates
  const totalBaseRate = nights.reduce((sum, n) => sum + n.effectiveRate, 0);

  // Pax surcharge
  const totalPax = numAdults + numChildren;
  const extraPax = Math.max(0, totalPax - accommodationType.base_pax);
  const paxSurchargePerNight = extraPax * accommodationType.additional_pax_fee;
  const totalPaxSurcharge = paxSurchargePerNight * totalNights;

  // Add-ons (per-stay, not per-night)
  let addonsTotal = 0;
  for (const { addon, quantity } of selectedAddons) {
    if (addon.pricing_model === 'per_person') {
      addonsTotal += addon.price * totalPax * quantity;
    } else {
      // per_booking
      addonsTotal += addon.price * quantity;
    }
  }

  return {
    nights,
    totalNights,
    totalBaseRate,
    extraPax,
    paxSurchargePerNight,
    totalPaxSurcharge,
    addonsTotal,
    grandTotal: totalBaseRate + totalPaxSurcharge + addonsTotal,
  };
}

/**
 * Calculate day tour pricing.
 */
export function calculateDayTourPrice(
  numAdults: number,
  numChildren: number,
  adultRate: number,
  childRate: number,
  selectedAddons: { addon: Addon; quantity: number }[] = []
): { baseAmount: number; addonsAmount: number; total: number } {
  const baseAmount = (numAdults * adultRate) + (numChildren * childRate);
  const totalPax = numAdults + numChildren;

  let addonsAmount = 0;
  for (const { addon, quantity } of selectedAddons) {
    if (addon.pricing_model === 'per_person') {
      addonsAmount += addon.price * totalPax * quantity;
    } else {
      addonsAmount += addon.price * quantity;
    }
  }

  return {
    baseAmount,
    addonsAmount,
    total: baseAmount + addonsAmount,
  };
}

/**
 * Format a number as Philippine Peso.
 */
export function formatPHP(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
