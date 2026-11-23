-- FOODIEHUB initial schema
-- MySQL 8 compatible

CREATE TABLE users (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    mobile          VARCHAR(15)  NOT NULL,
    password        VARCHAR(255) NOT NULL,
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roles (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    name       VARCHAR(50)  NOT NULL,
    created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_roles (
    user_id    BIGINT NOT NULL,
    role_id    BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE restaurants (
    id                    BIGINT        NOT NULL AUTO_INCREMENT,
    name                  VARCHAR(120)  NOT NULL,
    description           VARCHAR(1000) NOT NULL,
    cuisine_type          VARCHAR(80)   NOT NULL,
    address_line          VARCHAR(255)  NOT NULL,
    city                  VARCHAR(80)   NOT NULL,
    state                 VARCHAR(80)   NOT NULL,
    pincode               VARCHAR(10)   NOT NULL,
    latitude              DECIMAL(10,7) NULL,
    longitude             DECIMAL(10,7) NULL,
    image_url             VARCHAR(500)  NULL,
    banner_url            VARCHAR(500)  NULL,
    rating                DECIMAL(3,2)  NOT NULL DEFAULT 0.00,
    rating_count          INT           NOT NULL DEFAULT 0,
    is_active             BOOLEAN       NOT NULL DEFAULT TRUE,
    is_open               BOOLEAN       NOT NULL DEFAULT TRUE,
    opening_time          VARCHAR(8)    NOT NULL DEFAULT '09:00',
    closing_time          VARCHAR(8)    NOT NULL DEFAULT '23:00',
    min_order_amount      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    delivery_time_minutes INT           NOT NULL DEFAULT 30,
    price_for_two         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at            DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_restaurants_cuisine (cuisine_type),
    KEY idx_restaurants_active (is_active),
    KEY idx_restaurants_city (city),
    KEY idx_restaurants_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE restaurant_owners (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    user_id       BIGINT      NOT NULL,
    restaurant_id BIGINT      NOT NULL,
    created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_restaurant_owners_restaurant (restaurant_id),
    KEY idx_restaurant_owners_user (user_id),
    CONSTRAINT fk_ro_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ro_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE food_categories (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    name       VARCHAR(60)  NOT NULL,
    slug       VARCHAR(60)  NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0,
    image_url  VARCHAR(500) NULL,
    created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_food_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE food_items (
    id             BIGINT        NOT NULL AUTO_INCREMENT,
    restaurant_id  BIGINT        NOT NULL,
    category_id    BIGINT        NOT NULL,
    name           VARCHAR(120)  NOT NULL,
    description    VARCHAR(1000) NOT NULL,
    price          DECIMAL(10,2) NOT NULL,
    image_url      VARCHAR(500)  NULL,
    is_veg         BOOLEAN       NOT NULL DEFAULT TRUE,
    is_available   BOOLEAN       NOT NULL DEFAULT TRUE,
    is_bestseller  BOOLEAN       NOT NULL DEFAULT FALSE,
    rating         DECIMAL(3,2)  NOT NULL DEFAULT 0.00,
    rating_count   INT           NOT NULL DEFAULT 0,
    created_at     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_food_items_restaurant (restaurant_id),
    KEY idx_food_items_category (category_id),
    KEY idx_food_items_available (is_available),
    CONSTRAINT fk_food_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE,
    CONSTRAINT fk_food_category FOREIGN KEY (category_id) REFERENCES food_categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE addresses (
    id              BIGINT        NOT NULL AUTO_INCREMENT,
    user_id         BIGINT        NOT NULL,
    label           VARCHAR(30)   NOT NULL DEFAULT 'Home',
    full_name       VARCHAR(100)  NOT NULL,
    phone           VARCHAR(15)   NOT NULL,
    house_building  VARCHAR(120)  NOT NULL,
    street          VARCHAR(150)  NOT NULL,
    city            VARCHAR(80)   NOT NULL,
    state           VARCHAR(80)   NOT NULL,
    pincode         VARCHAR(10)   NOT NULL,
    instructions    VARCHAR(500)  NULL,
    latitude        DECIMAL(10,7) NULL,
    longitude       DECIMAL(10,7) NULL,
    is_default      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_addresses_user (user_id),
    CONSTRAINT fk_address_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cart (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    user_id        BIGINT       NOT NULL,
    restaurant_id  BIGINT       NULL,
    coupon_code    VARCHAR(30)  NULL,
    created_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_cart_user (user_id),
    KEY idx_cart_restaurant (restaurant_id),
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cart_items (
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    cart_id      BIGINT      NOT NULL,
    food_item_id BIGINT      NOT NULL,
    quantity     INT         NOT NULL DEFAULT 1,
    created_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_cart_items_cart_food (cart_id, food_item_id),
    KEY idx_cart_items_food (food_item_id),
    CONSTRAINT fk_ci_cart FOREIGN KEY (cart_id) REFERENCES cart (id) ON DELETE CASCADE,
    CONSTRAINT fk_ci_food FOREIGN KEY (food_item_id) REFERENCES food_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    order_number        VARCHAR(20)   NOT NULL,
    user_id             BIGINT        NOT NULL,
    restaurant_id       BIGINT        NOT NULL,
    address_id          BIGINT        NULL,
    status              VARCHAR(30)   NOT NULL DEFAULT 'ORDER_PLACED',
    subtotal            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    delivery_charge     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method      VARCHAR(20)   NOT NULL DEFAULT 'COD',
    payment_status      VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    coupon_code         VARCHAR(30)   NULL,
    customer_name       VARCHAR(100)  NOT NULL,
    customer_phone      VARCHAR(15)   NOT NULL,
    delivery_address    VARCHAR(500)  NOT NULL,
    delivery_instructions VARCHAR(500) NULL,
    notes               VARCHAR(500)  NULL,
    estimated_delivery_at DATETIME(6) NULL,
    placed_at           DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    confirmed_at        DATETIME(6)   NULL,
    delivered_at        DATETIME(6)   NULL,
    cancelled_at        DATETIME(6)   NULL,
    created_at          DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_orders_number (order_number),
    KEY idx_orders_user (user_id),
    KEY idx_orders_restaurant (restaurant_id),
    KEY idx_orders_status (status),
    KEY idx_orders_placed (placed_at),
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_order_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id),
    CONSTRAINT fk_order_address FOREIGN KEY (address_id) REFERENCES addresses (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
    id            BIGINT        NOT NULL AUTO_INCREMENT,
    order_id      BIGINT        NOT NULL,
    food_item_id  BIGINT        NULL,
    item_name     VARCHAR(120)  NOT NULL,
    item_image    VARCHAR(500)  NULL,
    unit_price    DECIMAL(10,2) NOT NULL,
    quantity      INT           NOT NULL,
    total_price   DECIMAL(10,2) NOT NULL,
    is_veg        BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_order_items_order (order_id),
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_oi_food FOREIGN KEY (food_item_id) REFERENCES food_items (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
    id                 BIGINT        NOT NULL AUTO_INCREMENT,
    order_id           BIGINT        NOT NULL,
    provider           VARCHAR(20)   NOT NULL DEFAULT 'COD',
    razorpay_order_id  VARCHAR(100)  NULL,
    razorpay_payment_id VARCHAR(100) NULL,
    amount             DECIMAL(10,2) NOT NULL,
    currency           VARCHAR(10)   NOT NULL DEFAULT 'INR',
    status             VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    created_at         DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at         DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_payments_razorpay_order (razorpay_order_id),
    KEY idx_payments_order (order_id),
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE delivery_partners (
    id             BIGINT        NOT NULL AUTO_INCREMENT,
    user_id        BIGINT        NULL,
    name           VARCHAR(100)  NOT NULL,
    phone          VARCHAR(15)   NOT NULL,
    vehicle_type   VARCHAR(30)   NOT NULL DEFAULT 'BIKE',
    is_available   BOOLEAN       NOT NULL DEFAULT TRUE,
    rating         DECIMAL(3,2)  NOT NULL DEFAULT 5.00,
    created_at     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_delivery_partners_user (user_id),
    CONSTRAINT fk_dp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE deliveries (
    id              BIGINT        NOT NULL AUTO_INCREMENT,
    order_id        BIGINT        NOT NULL,
    partner_id      BIGINT        NULL,
    status          VARCHAR(30)   NOT NULL DEFAULT 'ASSIGNED',
    progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    is_simulated    BOOLEAN       NOT NULL DEFAULT TRUE,
    picked_up_at    DATETIME(6)   NULL,
    delivered_at    DATETIME(6)   NULL,
    created_at      DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_deliveries_order (order_id),
    KEY idx_deliveries_partner (partner_id),
    KEY idx_deliveries_status (status),
    CONSTRAINT fk_delivery_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_delivery_partner FOREIGN KEY (partner_id) REFERENCES delivery_partners (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE coupons (
    id                BIGINT        NOT NULL AUTO_INCREMENT,
    code              VARCHAR(30)   NOT NULL,
    title             VARCHAR(120)  NOT NULL,
    description       VARCHAR(500)  NOT NULL,
    discount_type     VARCHAR(20)   NOT NULL,
    discount_value    DECIMAL(10,2) NOT NULL,
    min_order_amount  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    max_discount      DECIMAL(10,2) NULL,
    valid_from        DATETIME(6)   NOT NULL,
    valid_to          DATETIME(6)   NOT NULL,
    is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
    usage_limit       INT           NULL,
    used_count        INT           NOT NULL DEFAULT 0,
    created_at        DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at        DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_coupons_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reviews (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    user_id       BIGINT       NOT NULL,
    restaurant_id BIGINT       NOT NULL,
    order_id      BIGINT       NULL,
    rating        INT          NOT NULL,
    comment       VARCHAR(1000) NULL,
    created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_reviews_user_restaurant (user_id, restaurant_id),
    KEY idx_reviews_restaurant (restaurant_id),
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_review_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE,
    CONSTRAINT fk_review_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
