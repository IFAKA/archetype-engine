// E-commerce manifest - IskaYPet group (Kiwoko, Tiendanimal, Animalis) with 19 entities
import { defineManifest } from '../../src'
import settings from './settings'

// Import all entities
import { Customer } from './entities/customer'
import { Address } from './entities/address'
import { PaymentInstrument } from './entities/payment-instrument'
import { Product } from './entities/product'
import { ProductVariant } from './entities/product-variant'
import { ProductImage } from './entities/product-image'
import { Category } from './entities/category'
import { Brand } from './entities/brand'
import { Tag } from './entities/tag'
import { Order } from './entities/order'
import { OrderItem } from './entities/order-item'
import { Cart } from './entities/cart'
import { CartItem } from './entities/cart-item'
import { WishlistItem } from './entities/wishlist-item'
import { Review } from './entities/review'
import { Payment } from './entities/payment'
import { Shipment } from './entities/shipment'
import { Coupon } from './entities/coupon'
import { Store } from './entities/store'

export default defineManifest({
  entities: [
    // Customers
    Customer,
    Address,
    PaymentInstrument,

    // Products
    Product,
    ProductVariant,
    ProductImage,
    Category,
    Brand,
    Tag,

    // Orders & Fulfillment
    Order,
    OrderItem,
    Payment,
    Shipment,

    // Cart & Wishlist
    Cart,
    CartItem,
    WishlistItem,

    // Coupons & Stores
    Coupon,
    Store,

    // Reviews
    Review,
  ],
  ...settings,
})
