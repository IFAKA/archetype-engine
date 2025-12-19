// E-commerce manifest - Complex example with 15 entities
import { defineManifest } from '../../src'
import settings from './settings'

// Import all entities
import { Customer } from './entities/customer'
import { Address } from './entities/address'
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

export default defineManifest({
  entities: [
    // Customers
    Customer,
    Address,

    // Products
    Product,
    ProductVariant,
    ProductImage,
    Category,
    Brand,
    Tag,

    // Orders
    Order,
    OrderItem,
    Payment,

    // Cart & Wishlist
    Cart,
    CartItem,
    WishlistItem,

    // Reviews
    Review,
  ],
  ...settings,
})
