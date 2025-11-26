// src/common/enums/delivery-log-status.enum.ts
export enum DeliveryLogStatus {
  CREATED = 'created',
  ASSIGNED = 'assigned',
  PACKAGE_RECEIVED = 'package_received',
  PICKED_UP = 'picked_up',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED_WRONG_CODE = 'failed_wrong_code',
  FAILED_OTHER = 'failed_other',
}