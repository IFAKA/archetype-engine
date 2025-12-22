// Store entity - Physical store locations for Click & Collect
import { defineEntity, text, number, boolean } from '../../../src'

export const Store = defineEntity('Store', {
  fields: {
    storeId: text().required().unique().label('Store ID'),
    name: text().required().min(2).max(200).label('Store Name'),

    // Address
    street1: text().required().min(5).max(200).label('Street Address'),
    street2: text().optional().max(200).label('Apartment/Suite'),
    city: text().required().min(2).max(100).label('City'),
    state: text().required().min(2).max(100).label('State/Province'),
    postalCode: text().required().min(3).max(20).label('Postal Code'),
    country: text().required().min(2).max(2).uppercase().label('Country Code'),

    // Contact Information
    phone: text().optional().label('Phone Number'),
    email: text().optional().email().label('Email'),

    // Geolocation
    latitude: number().optional().label('Latitude'),
    longitude: number().optional().label('Longitude'),

    // Operational Status
    isActive: boolean().default(true).label('Active'),

    // Click & Collect Support
    clickAndCollectEnabled: boolean().default(false).label('Click & Collect Enabled'),
  },
  behaviors: {
    timestamps: true,
  },
  protected: false,
})
