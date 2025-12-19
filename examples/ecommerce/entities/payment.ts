// Payment entity
import { defineEntity, text, number, date, hasOne } from '../../../src'

export const Payment = defineEntity('Payment', {
  fields: {
    transactionId: text().required().unique().label('Transaction ID'),
    provider: text().required().oneOf(['stripe', 'paypal', 'square', 'manual'] as const).label('Payment Provider'),
    method: text().required().oneOf(['card', 'bank_transfer', 'wallet', 'cash'] as const).label('Payment Method'),
    status: text().default('pending').oneOf([
      'pending',
      'processing',
      'succeeded',
      'failed',
      'cancelled',
      'refunded'
    ] as const).label('Status'),
    amount: number().required().min(0).label('Amount'),
    currency: text().required().min(3).max(3).uppercase().label('Currency'),
    fee: number().default(0).min(0).label('Processing Fee'),
    netAmount: number().required().min(0).label('Net Amount'),
    cardLast4: text().optional().min(4).max(4).label('Card Last 4'),
    cardBrand: text().optional().label('Card Brand'),
    errorMessage: text().optional().label('Error Message'),
    processedAt: date().optional(),
    refundedAt: date().optional(),
  },
  relations: {
    order: hasOne('Order'),
  },
  behaviors: {
    timestamps: true,
    audit: true,
  },
})
