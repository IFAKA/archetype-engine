// Shipment entity for order fulfillment tracking
import { defineEntity, text, number, boolean, date, hasOne, hasMany } from '../../../src'

export const Shipment = defineEntity('Shipment', {
  fields: {
    shipmentNumber: text().required().unique().label('Shipment Number'),
    status: text().default('pending').oneOf([
      'pending',
      'processing',
      'picked',
      'packed',
      'shipped',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'failed',
      'returned'
    ] as const).label('Shipment Status'),

    // Carrier & Tracking
    carrier: text().optional().oneOf([
      'SEUR',
      'GLS',
      'MRW',
      'Correos',
      'DHL',
      'UPS',
      'FedEx',
      'Other'
    ] as const).label('Carrier'),
    carrierService: text().optional().label('Carrier Service'),
    trackingNumber: text().optional().label('Tracking Number'),
    trackingUrl: text().optional().url().label('Tracking URL'),

    // Package Details
    weight: number().optional().min(0).label('Weight (kg)'),
    length: number().optional().min(0).label('Length (cm)'),
    width: number().optional().min(0).label('Width (cm)'),
    height: number().optional().min(0).label('Height (cm)'),
    packageCount: number().default(1).min(1).integer().label('Package Count'),

    // Shipping Cost
    shippingCost: number().default(0).min(0).label('Shipping Cost'),
    insuranceValue: number().optional().min(0).label('Insurance Value'),

    // Dates
    estimatedDeliveryDate: date().optional().label('Estimated Delivery'),
    shippedAt: date().optional().label('Shipped At'),
    deliveredAt: date().optional().label('Delivered At'),

    // Delivery Details
    deliveryInstructions: text().optional().max(500).label('Delivery Instructions'),
    signatureRequired: boolean().default(false).label('Signature Required'),
    signedBy: text().optional().label('Signed By'),

    // Store Pickup (Kiwoko, Tiendanimal, Animalis)
    isStorePickup: boolean().default(false).label('Store Pickup'),
    pickupStoreId: text().optional().label('Pickup Store ID'),
    pickupReadyAt: date().optional().label('Ready for Pickup At'),
    pickedUpAt: date().optional().label('Picked Up At'),

    // Return/Failed Delivery
    returnReason: text().optional().label('Return Reason'),
    failureReason: text().optional().label('Delivery Failure Reason'),
    attemptCount: number().default(0).min(0).integer().label('Delivery Attempts'),

    // Carrier Response
    carrierReference: text().optional().label('Carrier Reference'),
    labelUrl: text().optional().url().label('Shipping Label URL'),
  },
  relations: {
    order: hasOne('Order'),
    originAddress: hasOne('Address'),
    destinationAddress: hasOne('Address'),
    store: hasOne('Store').optional(),
  },
  behaviors: {
    timestamps: true,
    audit: true,
  },
  protected: 'all',
})
