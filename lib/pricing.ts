import { addDays, isWeekend, parseISO, format } from 'date-fns';
import type { AccommodationType, RateAdjustment, Addon, NightBreakdown, PriceCalculation, PerRoomBreakdown } from '@/types';

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
  // Free child policy: 1 child (6 y/o and below) is free per room
  const freeChildren = Math.min(numChildren, 1);
  const billablePax = totalPax - freeChildren;
  const extraPax = Math.max(0, billablePax - accommodationType.base_pax);
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
 * Input for multi-room pricing: one entry per room with its accommodation type
 * and per-room guest counts.
 */
export interface MultiRoomPriceInput {
  roomId: string;
  type: AccommodationType;
  numAdults: number;
  numChildren: number;
}

/**
 * Result of multi-room price calculation: aggregate totals plus per-room breakdown.
 * Extra pax is allocated across types proportionally to (base_pax * count) so that
 * types with larger base capacity get a fair share of the extra guests.
 */
export interface MultiRoomPriceResult extends PriceCalculation {
  perRoomBreakdown: PerRoomBreakdown[];
}

/**
 * Full price calculation for a multi-room overnight booking.
 *
 * Each room now has its own guest counts (`numAdults`, `numChildren` in `MultiRoomPriceInput`).
 * Pax surcharge is calculated per room based on that room's actual occupancy vs its type's base_pax.
 *
 * Addons:
 * - `globalAddons` = per_booking addons, charged once (not per room).
 * - `perRoomAddons` = per_person addons keyed by room_id, charged based on that room's guest count.
 */
export function calculateMultiRoomPrice(
  checkIn: string,
  checkOut: string,
  roomEntries: MultiRoomPriceInput[],
  rateAdjustments: RateAdjustment[],
  globalAddons: { addon: Addon; quantity: number }[] = [],
  perRoomAddons: Record<string, { addon: Addon; quantity: number }[]> = {}
): MultiRoomPriceResult {
  if (roomEntries.length === 0) {
    return {
      nights: [],
      totalNights: 0,
      totalBaseRate: 0,
      extraPax: 0,
      paxSurchargePerNight: 0,
      totalPaxSurcharge: 0,
      addonsTotal: 0,
      grandTotal: 0,
      perRoomBreakdown: [],
    };
  }

  let globalTotalBaseRate = 0;
  let globalTotalPaxSurcharge = 0;
  let globalExtraPax = 0;
  let totalNights = 0;
  let nights: NightBreakdown[] = [];

  const perRoomBreakdown: PerRoomBreakdown[] = [];

  // Calculate per-room: base rate + pax surcharge + per-person addons
  for (const entry of roomEntries) {
    const { roomId, type, numAdults, numChildren } = entry;
    const roomPax = numAdults + numChildren;
    // Free child policy: 1 child free per room
    const freeChildren = Math.min(numChildren, 1);
    const billablePax = roomPax - freeChildren;
    const extraPax = Math.max(0, billablePax - type.base_pax);

    nights = calculateNightBreakdowns(checkIn, checkOut, type, rateAdjustments);
    totalNights = nights.length;
    const baseAmount = nights.reduce((sum, n) => sum + n.effectiveRate, 0);
    const paxSurcharge = extraPax * type.additional_pax_fee * totalNights;

    // Per-person addons for this room
    const roomAddons = perRoomAddons[roomId] ?? [];
    let roomAddonsAmount = 0;
    for (const { addon, quantity } of roomAddons) {
      roomAddonsAmount += addon.price * roomPax * quantity;
    }

    globalTotalBaseRate += baseAmount;
    globalTotalPaxSurcharge += paxSurcharge;
    globalExtraPax += extraPax;

    perRoomBreakdown.push({
      roomId,
      typeId: type.id,
      baseAmount,
      paxSurcharge,
      addonsAmount: roomAddonsAmount,
      totalAmount: baseAmount + paxSurcharge + roomAddonsAmount,
    });
  }

  // Global addons (per_booking) charged once
  let globalAddonsTotal = 0;
  for (const { addon, quantity } of globalAddons) {
    globalAddonsTotal += addon.price * quantity;
  }

  const addonsTotal = perRoomBreakdown.reduce((s, r) => s + r.addonsAmount, 0) + globalAddonsTotal;
  const grandTotal = globalTotalBaseRate + globalTotalPaxSurcharge + addonsTotal;

  return {
    nights,
    totalNights,
    totalBaseRate: globalTotalBaseRate,
    extraPax: globalExtraPax,
    paxSurchargePerNight: totalNights > 0 ? globalTotalPaxSurcharge / totalNights : 0,
    totalPaxSurcharge: globalTotalPaxSurcharge,
    addonsTotal,
    grandTotal,
    perRoomBreakdown,
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
