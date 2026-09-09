package com.ecommerce.service.impl;

import com.ecommerce.dto.request.CategoryRequest;
import com.ecommerce.dto.response.CategoryResponse;
import com.ecommerce.entity.Category;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;


    // =========================================================
    // CREATE CATEGORY
    // =========================================================

    @Override
    @Transactional
    public CategoryResponse create(CategoryRequest request) {

        validateRequest(request);

        String name = normalizeName(request.getName());

        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException(
                    "Category '" + name + "' already exists"
            );
        }

        Category category = Category.builder()
                .name(name)
                .description(normalizeDescription(request.getDescription()))
                .build();

        return toResponse(
                categoryRepository.save(category)
        );
    }


    // =========================================================
    // UPDATE CATEGORY
    // =========================================================

    @Override
    @Transactional
    public CategoryResponse update(
            Long id,
            CategoryRequest request
    ) {

        validateRequest(request);

        Category category = findEntity(id);

        String name = normalizeName(request.getName());

        /*
         * Prevent two different categories from having the same
         * name, while allowing the current category to retain its
         * existing name.
         */
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(
                name,
                id
        )) {
            throw new BadRequestException(
                    "Category '" + name + "' already exists"
            );
        }

        category.setName(name);

        category.setDescription(
                normalizeDescription(
                        request.getDescription()
                )
        );

        return toResponse(
                categoryRepository.save(category)
        );
    }


    // =========================================================
    // DELETE CATEGORY
    // =========================================================

    @Override
    @Transactional
    public void delete(Long id) {

        Category category = findEntity(id);

        /*
         * Product.category is a required relationship.
         *
         * Therefore a category containing products must not be
         * physically deleted.
         *
         * This protects:
         *
         * - existing products
         * - cart items
         * - order history
         * - database foreign-key integrity
         */
        if (category.getProducts() != null
                && !category.getProducts().isEmpty()) {

            throw new BadRequestException(
                    "Cannot delete category '" +
                            category.getName() +
                            "' because it contains products. " +
                            "Move or remove the products first."
            );
        }

        categoryRepository.delete(category);
    }


    // =========================================================
    // GET CATEGORY BY ID
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getById(Long id) {

        return toResponse(
                findEntity(id)
        );
    }


    // =========================================================
    // GET ALL CATEGORIES
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAll() {

        return categoryRepository
                .findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }


    // =========================================================
    // VALIDATE REQUEST
    // =========================================================

    private void validateRequest(
            CategoryRequest request
    ) {

        if (request == null) {
            throw new BadRequestException(
                    "Category information is required"
            );
        }

        if (request.getName() == null
                || request.getName().isBlank()) {

            throw new BadRequestException(
                    "Category name is required"
            );
        }

        if (request.getName().trim().length() > 100) {
            throw new BadRequestException(
                    "Category name cannot exceed 100 characters"
            );
        }

        if (request.getDescription() != null
                && request.getDescription().length() > 500) {

            throw new BadRequestException(
                    "Category description cannot exceed 500 characters"
            );
        }
    }


    // =========================================================
    // NORMALIZE CATEGORY NAME
    // =========================================================

    private String normalizeName(String name) {

        return name.trim();
    }


    // =========================================================
    // NORMALIZE DESCRIPTION
    // =========================================================

    private String normalizeDescription(
            String description
    ) {

        if (description == null
                || description.isBlank()) {

            return null;
        }

        return description.trim();
    }


    // =========================================================
    // FIND CATEGORY
    // =========================================================

    private Category findEntity(Long id) {

        return categoryRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Category not found with id: " + id
                        )
                );
    }


    // =========================================================
    // RESPONSE MAPPING
    // =========================================================

    private CategoryResponse toResponse(
            Category category
    ) {

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .build();
    }
}