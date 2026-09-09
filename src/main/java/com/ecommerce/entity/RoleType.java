package com.ecommerce.entity;

/**
 * Defines the three user modules described in the project:
 * ADMIN    - manages users, categories, all products and orders
 * SELLER   - manages own products and views orders for their products
 * CUSTOMER - browses products, manages cart, places orders
 */
public enum RoleType {
    ROLE_ADMIN,
    ROLE_SELLER,
    ROLE_CUSTOMER
}
