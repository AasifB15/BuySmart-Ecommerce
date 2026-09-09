package com.ecommerce.service;

import com.ecommerce.dto.request.ProductRequest;
import com.ecommerce.dto.response.ProductResponse;

import java.util.List;

public interface ProductService {
    ProductResponse create(String sellerEmail, ProductRequest request);
    ProductResponse update(String sellerEmail, Long productId, ProductRequest request);
    void delete(String sellerEmail, Long productId);
    ProductResponse getById(Long id);
    List<ProductResponse> getAll();
    List<ProductResponse> getByCategory(Long categoryId);
    List<ProductResponse> search(String keyword);
    List<ProductResponse> getMyProducts(String sellerEmail);
}
