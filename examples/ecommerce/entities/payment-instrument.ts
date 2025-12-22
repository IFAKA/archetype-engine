// Payment Instrument entity - Saved payment methods
import { defineEntity, text, number, boolean, hasOne } from '../../../src'

export const PaymentInstrument = defineEntity('PaymentInstrument', {
  fields: {
    paymentMethodId: text().required().label('Payment Method ID'),

    type: text().required().oneOf(['card', 'paypal', 'bank_transfer'] as const).label('Payment Type'),

    // Card Details (tokenized/masked)
    cardType: text().optional().label('Card Type'),
    cardholderName: text().optional().max(100).label('Cardholder Name'),
    maskedCardNumber: text().optional().label('Masked Card Number'),
    expirationMonth: number().optional().min(1).max(12).integer().label('Expiration Month'),
    expirationYear: number().optional().min(2024).integer().label('Expiration Year'),

    // Flags
    isDefault: boolean().default(false).label('Default Payment Method'),

    // External Payment Gateway Token
    paymentToken: text().optional().label('Payment Gateway Token'),
  },
  relations: {
    customer: hasOne('Customer'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
  },
  protected: 'all',
})
