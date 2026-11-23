-- Reference data: roles, food menu categories, coupons

INSERT INTO roles (name) VALUES
('CUSTOMER'),
('ADMIN'),
('RESTAURANT_OWNER'),
('DELIVERY_PARTNER');

INSERT INTO food_categories (name, slug, sort_order, image_url) VALUES
('Starters', 'starters', 1, 'https://www.themealdb.com/images/ingredients/Chicken.png'),
('Main Course', 'main-course', 2, 'https://www.themealdb.com/images/ingredients/Beef.png'),
('Biryani', 'biryani', 3, 'https://www.themealdb.com/images/ingredients/Rice.png'),
('Desserts', 'desserts', 4, 'https://www.themealdb.com/images/ingredients/Chocolate.png'),
('Beverages', 'beverages', 5, 'https://www.themealdb.com/images/ingredients/Orange%20Juice.png'),
('Snacks', 'snacks', 6, 'https://www.themealdb.com/images/ingredients/Potato.png');

INSERT INTO coupons (code, title, description, discount_type, discount_value, min_order_amount, max_discount, valid_from, valid_to, is_active, usage_limit, used_count) VALUES
('WELCOME50', 'Flat Rs.50 off', 'Get flat Rs.50 off on your first order above Rs.199', 'FIXED', 50.00, 199.00, NULL, '2025-01-01 00:00:00', '2030-12-31 23:59:59', TRUE, NULL, 0),
('FOODIE20', '20% off up to Rs.120', 'Save 20% on orders above Rs.399, up to Rs.120', 'PERCENTAGE', 20.00, 399.00, 120.00, '2025-01-01 00:00:00', '2030-12-31 23:59:59', TRUE, NULL, 0),
('HUNGRY100', 'Flat Rs.100 off', 'Flat Rs.100 off on orders above Rs.599', 'FIXED', 100.00, 599.00, NULL, '2025-01-01 00:00:00', '2030-12-31 23:59:59', TRUE, 1000, 0),
('SAVE15', '15% off', '15% off up to Rs.75 on orders above Rs.299', 'PERCENTAGE', 15.00, 299.00, 75.00, '2025-01-01 00:00:00', '2030-12-31 23:59:59', TRUE, NULL, 0);
