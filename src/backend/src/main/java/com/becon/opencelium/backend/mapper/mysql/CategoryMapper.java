package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.utils.HelperMapper;
import com.becon.opencelium.backend.resource.schedule.CategoryDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = {
                HelperMapper.class
        }

)
@Named("categoryMapper")
public interface CategoryMapper extends Mapper<Category, CategoryDTO> {
    @Named("toEntity")
    @Mappings({
            @Mapping(target = "parentCategory",qualifiedByName = {"helperMapper","getCategoryById"}),
            @Mapping(target = "subCategories", qualifiedByName = {"helperMapper","getCategoriesByIds"})
    })
    Category toEntity(CategoryDTO dto);

    @Named("toDTO")
    @Mappings({
            @Mapping(target = "parentCategory", source = "parentCategory.id"),
            @Mapping(target = "subCategories", qualifiedByName = {"helperMapper","mapCategoriesToIds"})
    })
    CategoryDTO toDTO(Category entity);
}
