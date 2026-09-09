package com.ecommerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * E-Commerce Management System
 * Entry point of the Spring Boot application.
 *
 * Modules: Admin, Seller, Customer
 * Stack: Spring Boot, Spring Security (JWT), Spring Data JPA (Hibernate), MySQL
 */
@SpringBootApplication
public class EcommerceApplication {

    public static void main(String[] args) {
        SpringApplication.run(EcommerceApplication.class, args);
    }
}
