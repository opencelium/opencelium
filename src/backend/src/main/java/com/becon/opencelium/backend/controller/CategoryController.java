package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.database.mysql.service.CategoryService;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.CategoryResponseDTO;
import com.becon.opencelium.backend.resource.IdentifiersDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.CategoryDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping(value = "/api/category", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Category", description = "Manages operations related to Category management")
public class CategoryController {
    private final CategoryService categoryService;
    private final Mapper<Category, CategoryResponseDTO> categoryResponseMapper;

    public CategoryController(
            @Qualifier("categoryServiceImp") CategoryService categoryService,
            Mapper<Category, CategoryResponseDTO> categoryResponseMapper
    ) {
        this.categoryService = categoryService;
        this.categoryResponseMapper = categoryResponseMapper;
    }

    @Operation(summary = "Retrieves a category from database by provided category ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Category has been successfully retrieved",
                    content = @Content(schema = @Schema(implementation = CategoryDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(path = "/{id}")
    public ResponseEntity<?> get(@PathVariable Integer id) {
        Category category = categoryService.get(id);
        return ResponseEntity.ok(categoryResponseMapper.toDTO(category));
    }

    @Operation(summary = "Retrieves all categories from database")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Categories have been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = CategoryDTO.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(path = "/all")
    public ResponseEntity<?> getAll() {
        List<Category> categories = categoryService.getAll();
        return ResponseEntity.ok(categoryResponseMapper.toDTOAll(categories));
    }

    @Operation(summary = "Creates a category")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201",
                    description = "Category has been successfully created",
                    content = @Content(schema = @Schema(implementation = CategoryDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> add(@RequestBody CategoryDTO dto) {
        Integer id = categoryService.add(dto);

        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .buildAndExpand().toUri();
        return ResponseEntity.created(uri)
                .body(categoryResponseMapper.toDTO(categoryService.get(id)));
    }

    @Operation(summary = "Modifies a category by provided category ID and accepting category data in request body.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Category has been successfully modified",
                    content = @Content(schema = @Schema(implementation = CategoryDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody CategoryDTO dto) {
        dto.setId(id);
        categoryService.update(dto);
        return ResponseEntity.ok(categoryResponseMapper.toDTO(categoryService.get(id)));
    }

    @Operation(summary = "Deletes: a category with given ID; connections related to this category; sub categories and connections related to them")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204",
                    description = "Category has been successfully deleted.",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping("/cascade-delete/{id}")
    public ResponseEntity<?> cascadeDelete(@PathVariable Integer id) {
        categoryService.cascadeDelete(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "For each id, it deletes: a category with given ID; connections related to this category; sub categories and connections related to them")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204",
                    description = "List of categories have been deleted",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping("/list/cascade-delete")
    public ResponseEntity<?> cascadeDeleteFromList(@RequestBody IdentifiersDTO<Integer> ids) {
        categoryService.cascadeDeleteAll(ids.getIdentifiers());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Deletes only category with given ID ")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204",
                    description = "Category has been successfully deleted.",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        categoryService.deleteOnly(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Deletes list of categories with given ids")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204",
                    description = "List of categories have been deleted",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping("/list/delete")
    public ResponseEntity<?> deleteFromList(@RequestBody IdentifiersDTO<Integer> ids) {
        categoryService.deleteAllOnly(ids.getIdentifiers());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Validates name of category for uniqueness")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Category Name has been successfully validate. Return EXISTS or NOT_EXISTS values in 'message' property.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/check/{name}")
    public ResponseEntity<?> existsByName(@PathVariable("name") String name) throws IOException {
        RuntimeException ex;
        if (categoryService.existsByName(name)) {
            ex = new RuntimeException("EXISTS");
        } else {
            ex = new RuntimeException("NOT_EXISTS");
        }

        String uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri().toString();
        ErrorResource errorResource = new ErrorResource(ex, HttpStatus.OK, uri);
        return ResponseEntity.ok().body(errorResource);
    }
}