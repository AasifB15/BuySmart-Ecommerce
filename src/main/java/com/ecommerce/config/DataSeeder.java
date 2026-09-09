package com.ecommerce.config;

import com.ecommerce.entity.Category;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.RoleType;
import com.ecommerce.entity.User;
import com.ecommerce.entity.Coupon;
import com.ecommerce.entity.Review;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.CouponRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ReviewRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;
    private final CouponRepository couponRepository;
    private final ReviewRepository reviewRepository;

    @Override
    public void run(String... args) {
        seedAdmin();
        seedCustomer();
        seedCategories();
        seedDemoCatalog();
        seedCoupons();
        seedReviews();
    }

    private void seedAdmin() {
        userRepository.findByEmail("admin@ecommerce.com").ifPresentOrElse(
                admin -> {
                    if (!passwordEncoder.matches("Admin@123", admin.getPassword())) {
                        admin.setPassword(passwordEncoder.encode("Admin@123"));
                        admin.setEnabled(true);
                        userRepository.save(admin);
                        log.info("Default admin password reset to encoded Admin@123.");
                    }
                },
                () -> {
                    User admin = User.builder()
                            .fullName("System Admin")
                            .email("admin@ecommerce.com")
                            .password(passwordEncoder.encode("Admin@123"))
                            .role(RoleType.ROLE_ADMIN)
                            .enabled(true)
                            .build();

                    userRepository.save(admin);
                    log.info("Default admin account created.");
                }
        );
    }

    private void seedCustomer() {
        userRepository.findByEmail("customer@ecommerce.com").ifPresentOrElse(
                customer -> {
                    if (!passwordEncoder.matches("Customer@123", customer.getPassword())) {
                        customer.setPassword(passwordEncoder.encode("Customer@123"));
                        customer.setEnabled(true);
                        userRepository.save(customer);
                        log.info("Default customer password reset to encoded Customer@123.");
                    }
                },
                () -> {
                    User customer = User.builder()
                            .fullName("John Doe")
                            .email("customer@ecommerce.com")
                            .password(passwordEncoder.encode("Customer@123"))
                            .phoneNumber("9876543210")
                            .role(RoleType.ROLE_CUSTOMER)
                            .enabled(true)
                            .build();

                    userRepository.save(customer);
                    log.info("Default customer account created.");
                }
        );
    }

    private void seedCategories() {
        List<String> categories = List.of(
                "Electronics",
                "Fashion",
                "Home & Kitchen",
                "Books",
                "Sports & Fitness"
        );

        for (String categoryName : categories) {
            if (!categoryRepository.existsByNameIgnoreCase(categoryName)) {
                categoryRepository.save(
                        Category.builder()
                                .name(categoryName)
                                .description(categoryName + " products")
                                .build()
                );
            }
        }
    }

    private void seedDemoCatalog() {

        User seller = userRepository.findByEmail("seller@shopsphere.local")
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .fullName("ShopSphere Store")
                                .email("seller@shopsphere.local")
                                .password(passwordEncoder.encode("Seller@123"))
                                .role(RoleType.ROLE_SELLER)
                                .shopName("ShopSphere")
                                .enabled(true)
                                .build()
                ));

        seedElectronics(seller);
        seedFashion(seller);
        seedHomeAndKitchen(seller);
        seedBooks(seller);
        seedSportsAndFitness(seller);

        log.info("BuySmart demo catalog verification completed. Product count: {}",
                productRepository.count());
    }

    private void seedElectronics(User seller) {

        addProduct(
                "Wireless Headphones",
                "Comfortable wireless headphones with clear sound and long battery life.",
                "2499.00", 25,
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "Smart Watch Pro",
                "Modern smartwatch with fitness tracking and everyday notifications.",
                "3999.00", 18,
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "Bluetooth Speaker",
                "Portable speaker with powerful audio for home and outdoor use.",
                "1799.00", 30,
                "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "Mechanical Keyboard",
                "Responsive mechanical keyboard designed for work and gaming.",
                "3299.00", 15,
                "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "Wireless Mouse",
                "Ergonomic wireless mouse with accurate tracking.",
                "899.00", 40,
                "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "USB-C Hub",
                "Multi-port USB-C hub for laptops and modern workstations.",
                "1499.00", 22,
                "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "Power Bank 20000mAh",
                "High-capacity power bank for travel and everyday charging.",
                "1599.00", 35,
                "https://images.unsplash.com/photo-1609592424816-9b7f5c9c2d2e?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "Laptop Stand",
                "Adjustable aluminum laptop stand for comfortable desk setups.",
                "1299.00", 20,
                "https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "Wireless Earbuds",
                "Compact true wireless earbuds with charging case.",
                "2199.00", 28,
                "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "1080p Webcam",
                "Full HD webcam suitable for meetings, classes and streaming.",
                "1899.00", 17,
                "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "Portable SSD 1TB",
                "Fast external solid-state storage for files and backups.",
                "6499.00", 12,
                "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "Smartphone Tripod",
                "Flexible tripod for photography, video calls and content creation.",
                "999.00", 32,
                "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "LED Desk Lamp",
                "Adjustable LED desk lamp with modern minimalist styling.",
                "1199.00", 24,
                "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "Gaming Controller",
                "Comfortable wireless controller for PC and compatible devices.",
                "2799.00", 16,
                "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "Tablet Sleeve",
                "Protective padded sleeve for tablets and compact laptops.",
                "799.00", 35,
                "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "Fast Charging Adapter",
                "Compact fast-charging wall adapter for modern devices.",
                "699.00", 45,
                "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "Smart LED Bulb",
                "Energy-efficient smart bulb with adjustable brightness.",
                "549.00", 50,
                "https://images.unsplash.com/photo-1550985543-fb7a1c9d7d4a?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "Noise Cancelling Headphones",
                "Over-ear headphones designed for focused listening and travel.",
                "5999.00", 10,
                "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "Digital Alarm Clock",
                "Minimal digital alarm clock with a clean modern display.",
                "899.00", 26,
                "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=800&q=80",
                "Electronics", seller);

        addProduct(
                "Mini Projector",
                "Compact projector for movies, presentations and entertainment.",
                "7499.00", 8,
                "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=800&q=80",
                "Electronics", seller);
    }

    private void seedFashion(User seller) {

        addProduct("Classic Cotton T-Shirt",
                "Soft cotton everyday t-shirt with a comfortable regular fit.",
                "699.00", 45,
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
                "Fashion", seller);

        addProduct("Slim Fit Denim Jeans",
                "Versatile slim-fit denim jeans for casual everyday styling.",
                "1899.00", 30,
                "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80",
                "Fashion", seller);

        addProduct("Casual Hoodie",
                "Warm fleece hoodie with a clean minimal design.",
                "1599.00", 25,
                "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
                "Fashion", seller);

        addProduct("Canvas Daypack",
                "Durable daypack with spacious compartments for daily essentials.",
                "1899.00", 18,
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
                "Fashion", seller);

        addProduct("Classic Sneakers",
                "Comfortable sneakers suitable for casual daily wear.",
                "2299.00", 22,
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
                "Fashion", seller);

        addProduct("Leather Wallet",
                "Compact wallet with multiple card and cash compartments.",
                "999.00", 32,
                "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80",
                "Fashion", seller);

        addProduct("Minimalist Backpack",
                "Modern backpack designed for work, college and travel.",
                "2499.00", 20,
                "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80",
                "Fashion", seller);

        addProduct("Linen Casual Shirt",
                "Breathable linen shirt for relaxed everyday outfits.",
                "1299.00", 28,
                "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80",
                "Fashion", seller);

        addProduct("Running Shoes",
                "Lightweight running shoes designed for everyday training.",
                "2799.00", 19,
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
                "Fashion", seller);

        addProduct("Classic Sunglasses",
                "Timeless sunglasses with a lightweight everyday frame.",
                "899.00", 35,
                "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
                "Fashion", seller);

        addProduct("Casual Chinos",
                "Comfortable chinos that work for casual and smart-casual looks.",
                "1499.00", 24,
                "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80",
                "Fashion", seller);

        addProduct("Oversized Sweatshirt",
                "Relaxed-fit sweatshirt with a soft brushed interior.",
                "1399.00", 21,
                "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
                "Fashion", seller);

        addProduct("Everyday Cap",
                "Adjustable cotton cap for casual outdoor styling.",
                "499.00", 40,
                "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&q=80",
                "Fashion", seller);

        addProduct("Travel Duffel Bag",
                "Spacious duffel bag designed for weekend travel.",
                "2199.00", 16,
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
                "Fashion", seller);

        addProduct("Formal Oxford Shirt",
                "Classic Oxford shirt suitable for office and formal occasions.",
                "1699.00", 20,
                "https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?w=800&q=80",
                "Fashion", seller);

        addProduct("Crossbody Sling Bag",
                "Compact sling bag for carrying daily essentials.",
                "1199.00", 27,
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
                "Fashion", seller);

        addProduct("Knitted Beanie",
                "Warm knitted beanie for cool weather comfort.",
                "599.00", 33,
                "https://images.unsplash.com/photo-1575428652377-a2d9b8a0e3d3?w=800&q=80",
                "Fashion", seller);

        addProduct("Premium Polo Shirt",
                "Smart casual polo shirt made for comfortable everyday wear.",
                "1199.00", 26,
                "https://images.unsplash.com/photo-1625910513413-5fc45a6c2b8a?w=800&q=80",
                "Fashion", seller);

        addProduct("Everyday Belt",
                "Classic belt with durable construction and simple styling.",
                "799.00", 38,
                "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800&q=80",
                "Fashion", seller);

        addProduct("Lightweight Windbreaker",
                "Packable windbreaker for changing outdoor weather.",
                "1999.00", 15,
                "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&q=80",
                "Fashion", seller);
    }

    private void seedHomeAndKitchen(User seller) {

        addProduct("Insulated Travel Bottle",
                "Keeps your favourite drink warm or cool throughout the day.",
                "799.00", 35,
                "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Ceramic Coffee Mug",
                "Minimal ceramic mug perfect for coffee, tea and hot chocolate.",
                "399.00", 50,
                "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Non Stick Frying Pan",
                "Durable non-stick frying pan for everyday cooking.",
                "1299.00", 22,
                "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Wooden Serving Board",
                "Elegant wooden serving board for snacks and entertaining.",
                "899.00", 18,
                "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Cotton Cushion Set",
                "Soft decorative cushion covers for a comfortable living space.",
                "999.00", 25,
                "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Minimal Table Lamp",
                "Warm ambient table lamp for desks and bedside tables.",
                "1599.00", 14,
                "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Glass Storage Jars",
                "Reusable glass jars for organized kitchen storage.",
                "699.00", 30,
                "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Stainless Steel Bottle",
                "Reusable stainless steel bottle for everyday hydration.",
                "749.00", 42,
                "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Kitchen Knife Set",
                "Essential kitchen knives with comfortable handles.",
                "1499.00", 17,
                "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Bamboo Organizer",
                "Natural bamboo organizer for kitchen and home storage.",
                "799.00", 24,
                "https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Soft Bath Towel",
                "Absorbent cotton towel with a soft comfortable finish.",
                "549.00", 35,
                "https://images.unsplash.com/photo-1583845112203-454c8b7a2d37?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Aroma Diffuser",
                "Compact diffuser for creating a relaxing home atmosphere.",
                "1199.00", 20,
                "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Modern Wall Clock",
                "Minimal wall clock designed for contemporary interiors.",
                "999.00", 16,
                "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Ceramic Planter",
                "Modern planter for small indoor plants and succulents.",
                "599.00", 31,
                "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Kitchen Measuring Set",
                "Practical measuring cups and spoons for precise cooking.",
                "449.00", 28,
                "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Electric Kettle",
                "Fast-boiling electric kettle for tea, coffee and hot water.",
                "1799.00", 19,
                "https://images.unsplash.com/photo-1594213114663-d94db9b1714a?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Cotton Bedsheet",
                "Comfortable cotton bedsheet with a clean modern pattern.",
                "1299.00", 23,
                "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Reusable Food Containers",
                "Stackable containers for organized food storage.",
                "899.00", 34,
                "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Wooden Hanger Set",
                "Smooth wooden hangers for organized wardrobes.",
                "699.00", 27,
                "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80",
                "Home & Kitchen", seller);

        addProduct("Premium Chef Apron",
                "Durable kitchen apron designed for comfortable cooking.",
                "649.00", 21,
                "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&q=80",
                "Home & Kitchen", seller);
    }

    private void seedBooks(User seller) {

        addProduct("Atomic Habits",
                "A practical guide to building better habits through small changes.",
                "599.00", 30,
                "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
                "Books", seller);

        addProduct("The Psychology of Money",
                "Insights into how people think about money, wealth and investing.",
                "499.00", 28,
                "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80",
                "Books", seller);

        addProduct("Clean Code",
                "A classic software development guide focused on readable code.",
                "799.00", 18,
                "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80",
                "Books", seller);

        addProduct("Java Programming Guide",
                "A practical introduction to Java programming concepts.",
                "699.00", 20,
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
                "Books", seller);

        addProduct("Effective Java",
                "Best practices and patterns for professional Java development.",
                "899.00", 15,
                "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80",
                "Books", seller);

        addProduct("The Alchemist",
                "A timeless inspirational novel about dreams and discovering purpose.",
                "399.00", 40,
                "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
                "Books", seller);

        addProduct("Ikigai",
                "A thoughtful exploration of purpose, balance and meaningful living.",
                "449.00", 35,
                "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80",
                "Books", seller);

        addProduct("Deep Work",
                "A guide to focused productivity in a distracted world.",
                "549.00", 24,
                "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&q=80",
                "Books", seller);

        addProduct("Rich Dad Poor Dad",
                "A popular introduction to financial education and money mindset.",
                "499.00", 32,
                "https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&q=80",
                "Books", seller);

        addProduct("Think and Grow Rich",
                "Classic personal development principles focused on achievement.",
                "349.00", 36,
                "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80",
                "Books", seller);

        addProduct("Design Patterns",
                "Software design patterns and reusable object-oriented solutions.",
                "999.00", 14,
                "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80",
                "Books", seller);

        addProduct("Python Crash Course",
                "Hands-on introduction to Python programming and projects.",
                "799.00", 22,
                "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80",
                "Books", seller);

        addProduct("Learning React",
                "Practical concepts for building modern React applications.",
                "749.00", 19,
                "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80",
                "Books", seller);

        addProduct("The Pragmatic Programmer",
                "Practical principles for becoming a better software developer.",
                "899.00", 17,
                "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80",
                "Books", seller);

        addProduct("Start With Why",
                "A business and leadership book about purpose-driven thinking.",
                "499.00", 25,
                "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80",
                "Books", seller);

        addProduct("Mindset",
                "Explores how beliefs about ability influence learning and growth.",
                "449.00", 27,
                "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
                "Books", seller);

        addProduct("The Power of Now",
                "A reflective guide to mindfulness and living in the present.",
                "399.00", 31,
                "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80",
                "Books", seller);

        addProduct("Cracking the Coding Interview",
                "Technical interview preparation with programming problems and strategies.",
                "999.00", 16,
                "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80",
                "Books", seller);

        addProduct("Computer Networks",
                "A foundational textbook covering networking concepts and protocols.",
                "849.00", 13,
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
                "Books", seller);

        addProduct("Database System Concepts",
                "Comprehensive introduction to relational databases and database systems.",
                "949.00", 12,
                "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80",
                "Books", seller);
    }

    private void seedSportsAndFitness(User seller) {

        addProduct("Yoga Mat",
                "Non-slip exercise mat for yoga, stretching and home workouts.",
                "899.00", 30,
                "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Adjustable Dumbbells",
                "Space-saving adjustable dumbbells for strength training.",
                "2999.00", 12,
                "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Resistance Bands",
                "Set of resistance bands for versatile home workouts.",
                "699.00", 40,
                "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Sports Water Bottle",
                "Durable hydration bottle designed for workouts and outdoor activities.",
                "599.00", 35,
                "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Running Shoes Pro",
                "Lightweight running shoes with comfortable everyday cushioning.",
                "2999.00", 18,
                "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Fitness Tracker",
                "Wearable tracker for daily activity and workout monitoring.",
                "2499.00", 20,
                "https://images.unsplash.com/photo-1557935728-e6d1eaabe558?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Gym Gloves",
                "Comfortable training gloves with supportive wrist coverage.",
                "499.00", 32,
                "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Skipping Rope",
                "Adjustable skipping rope for cardio and conditioning workouts.",
                "399.00", 45,
                "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Foam Roller",
                "Firm foam roller for stretching and post-workout recovery.",
                "999.00", 25,
                "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Exercise Ball",
                "Stability ball for core training, mobility and stretching.",
                "1199.00", 15,
                "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Tennis Racket",
                "Balanced racket suitable for recreational and intermediate players.",
                "2299.00", 14,
                "https://images.unsplash.com/photo-1617083934555-5a8d7c1b4b6a?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Football",
                "Durable training football suitable for outdoor play.",
                "899.00", 22,
                "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Basketball",
                "Durable basketball for training and recreational games.",
                "999.00", 20,
                "https://images.unsplash.com/photo-1518065896235-a4c93e088e7d?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Cricket Bat",
                "Balanced cricket bat suitable for practice and recreational play.",
                "2499.00", 13,
                "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Cycling Helmet",
                "Lightweight protective helmet designed for everyday cycling.",
                "1599.00", 19,
                "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Training Kettlebell",
                "Compact kettlebell for strength and conditioning workouts.",
                "1399.00", 16,
                "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Sports Duffle Bag",
                "Spacious gym bag with compartments for workout essentials.",
                "1299.00", 21,
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Workout Towel",
                "Quick-drying towel designed for gym and sports activities.",
                "399.00", 38,
                "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Pull Up Bar",
                "Doorway pull-up bar for convenient upper-body workouts at home.",
                "1799.00", 11,
                "https://images.unsplash.com/photo-1598971639058-5d1a3c3c3b4d?w=800&q=80",
                "Sports & Fitness", seller);

        addProduct("Smart Jump Rope",
                "Modern jump rope designed for cardio training and workout tracking.",
                "1099.00", 17,
                "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&q=80",
                "Sports & Fitness", seller);
    }

    private void addProduct(
            String name,
            String description,
            String price,
            int stock,
            String imageUrl,
            String categoryName,
            User seller
    ) {

        if (productRepository.findByNameIgnoreCase(name).isPresent()) {
            return;
        }

        Category category = categoryRepository
                .findByNameIgnoreCase(categoryName)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Missing category: " + categoryName
                        ));

        Product product = Product.builder()
                .name(name)
                .description(description)
                .price(new BigDecimal(price))
                .stockQuantity(stock)
                .imageUrl(imageUrl)
                .category(category)
                .seller(seller)
                .active(true)
                .build();

        productRepository.save(product);
    }

    private void seedCoupons() {
        if (couponRepository.count() > 0) {
            return;
        }

        List<Coupon> coupons = List.of(
                Coupon.builder()
                        .code("BUYSMART20")
                        .description("20% off on your entire shopping cart up to ₹1,000")
                        .discountPercentage(20)
                        .minimumOrderAmount(new BigDecimal("999.00"))
                        .maxDiscountAmount(new BigDecimal("1000.00"))
                        .active(true)
                        .expiryDate(LocalDateTime.now().plusMonths(6))
                        .build(),
                Coupon.builder()
                        .code("FLAT500")
                        .description("Flat ₹500 instant discount on orders above ₹2,499")
                        .flatDiscountAmount(new BigDecimal("500.00"))
                        .minimumOrderAmount(new BigDecimal("2499.00"))
                        .active(true)
                        .expiryDate(LocalDateTime.now().plusMonths(6))
                        .build(),
                Coupon.builder()
                        .code("WELCOME10")
                        .description("Welcome special: 10% discount on all orders above ₹499")
                        .discountPercentage(10)
                        .minimumOrderAmount(new BigDecimal("499.00"))
                        .maxDiscountAmount(new BigDecimal("500.00"))
                        .active(true)
                        .expiryDate(LocalDateTime.now().plusMonths(12))
                        .build()
        );

        couponRepository.saveAll(coupons);
        log.info("Seeded {} active promotional coupons.", coupons.size());
    }

    private void seedReviews() {
        if (reviewRepository.count() > 0) {
            return;
        }

        User customer = userRepository.findByEmail("customer@ecommerce.com").orElse(null);
        if (customer == null) {
            return;
        }

        List<Product> products = productRepository.findAll();
        if (products.isEmpty()) {
            return;
        }

        // Seed reviews for the first 3 products
        for (int i = 0; i < Math.min(5, products.size()); i++) {
            Product p = products.get(i);

            Review r1 = Review.builder()
                    .rating(5)
                    .title("Exceptional quality and fast delivery!")
                    .comment("Received in pristine condition. Exactly as described, and the build quality exceeded my expectations. Will definitely buy again from BuySmart!")
                    .verifiedPurchase(true)
                    .product(p)
                    .user(customer)
                    .build();

            Review r2 = Review.builder()
                    .rating(4)
                    .title("Great value for money")
                    .comment("Works flawlessly out of the box. Highly recommended for daily use. Prompt packaging and tracking updates.")
                    .verifiedPurchase(true)
                    .product(p)
                    .user(customer)
                    .build();

            reviewRepository.saveAll(List.of(r1, r2));

            p.setAverageRating(4.5);
            p.setReviewCount(2);
            productRepository.save(p);
        }

        log.info("Seeded verified sample customer reviews and ratings.");
    }
}