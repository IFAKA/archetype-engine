// Address entity
import { defineEntity, text, boolean, hasOne } from '../../../src'

export const Address = defineEntity('Address', {
  fields: {
    // Person Information (SFRA requirement)
    firstName: text().required().min(1).max(50).trim().label('First Name'),
    lastName: text().required().min(1).max(50).trim().label('Last Name'),
    phone: text().optional().label('Phone Number'),

    // SFCC Integration
    addressId: text().optional().label('Address Book ID'),

    // Address Details
    label: text().optional().max(50).label('Address Label'),
    street1: text().required().min(5).max(200).label('Street Address'),
    street2: text().optional().max(200).label('Apartment/Suite'),
    city: text().required().min(2).max(100).label('City'),
    state: text().required().min(2).max(100).label('State/Province'),
    postalCode: text().required().min(3).max(20).label('Postal Code'),
    country: text().required().min(2).max(2).uppercase().label('Country Code'),
    isDefault: boolean().default(false),
    isBilling: boolean().default(false),
    isShipping: boolean().default(true),
  },
  relations: {
    customer: hasOne('Customer'),
  },
  behaviors: {
    timestamps: true,
    softDelete: false,
  },
  protected: 'all',
})
