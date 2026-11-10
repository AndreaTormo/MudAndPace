import {
  EventEditPayload,
  EventFormValue,
  EventPayload,
  EventVariantFormValue,
  EventVariantPayload
} from '../../../core/models/event.model';

const EDITABLE_FIELDS_BY_PAYLOAD: readonly (keyof EventEditPayload)[] = [
  'name',
  'description',
  'categoryId',
  'locationId',
  'distanceKm',
  'elevationGain',
  'variants'
];

export const EDITABLE_FIELDS: readonly (keyof EventFormValue)[] = EDITABLE_FIELDS_BY_PAYLOAD;

function toVariantPayload(variant: EventVariantFormValue): EventVariantPayload {
  return {
    name: variant.name.trim(),
    distanceKm: variant.distanceKm ?? 0,
    elevationGain: variant.elevationGain ?? 0,
    price: variant.price ?? 0
  };
}

export function toEventPayload(value: EventFormValue): EventPayload {
  return {
    name: value.name.trim(),
    description: value.description.trim() || undefined,
    hostId: value.hostId,
    categoryId: value.categoryId,
    locationId: value.locationId,
    startDate: value.startDate,
    endDate: value.endDate,
    distanceKm: value.distanceKm ?? 0,
    elevationGain: value.elevationGain ?? 0,
    price: value.price ?? 0,
    variants: value.variants.map(toVariantPayload),
    status: value.status,
    isActive: value.isActive
  };
}

export function toEventEditPayload(value: EventFormValue): EventEditPayload {
  return {
    name: value.name.trim(),
    description: value.description.trim(),
    categoryId: value.categoryId,
    locationId: value.locationId,
    distanceKm: value.distanceKm ?? 0,
    elevationGain: value.elevationGain ?? 0,
    variants: value.variants.map(toVariantPayload)
  };
}
