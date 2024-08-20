package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.utils.HelperMapper;
import com.becon.opencelium.backend.resource.CategoryResponseDTO;
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
public interface CategoryResponseMapper extends Mapper<Category, CategoryResponseDTO> {

    @Named("toDTO")
    @Mappings({
            @Mapping(target = "parentCategory", qualifiedByName = {"helperMapper","mapParentCategory"}),
            @Mapping(target = "subCategories", qualifiedByName = {"helperMapper","mapCategoriesToIds"})
    })
    CategoryResponseDTO toDTO(Category entity);

    @Override
    default Category toEntity(CategoryResponseDTO dto){
        return null;
    }
}
