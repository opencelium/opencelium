package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;
import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistoryDetail;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.repository.OperationUsageHistoryRepository;
import com.becon.opencelium.backend.resource.subs.OperationUsageHistoryDto;
import com.becon.opencelium.backend.resource.subs.OperationUsageDetailsDto;
import com.becon.opencelium.backend.resource.subs.PaginatedDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OperationUsageHistoryServiceImpl implements OperationUsageHistoryService {

    @Autowired
    private OperationUsageHistoryRepository operationUsageHistoryRepository;
    @Autowired
    private OperationUsageHistoryDetailServiceImp operationUsageHistoryDetailServiceImp;

    @Override
    public void save(OperationUsageHistory operationUsageHistory) {
        operationUsageHistoryRepository.save(operationUsageHistory);
    }

    @Override
    public List<OperationUsageHistory> findAll() {
        return operationUsageHistoryRepository.findAll();
    }

    @Override
    public Page<OperationUsageHistory> getAllUsage(int page, int size, String[] sort) {
        Sort.Direction direction = Sort.Direction.fromString(sort[1]);
        Sort sortBy = Sort.by(direction, sort[0]);
        Pageable pageable = PageRequest.of(page, size, sortBy);
        return operationUsageHistoryRepository.findAll(pageable);
    }

    @Override
    public Page<OperationUsageHistoryDetail> getAllUsageDetailsByUsageId(
            Long usageId,
            int page,
            int size,
            String[] sort,
            LocalDateTime startDate,
            LocalDateTime endDate) {
        Sort.Direction direction = Sort.Direction.fromString(sort[1]);
        Sort sortBy = Sort.by(direction, sort[0]);
        Pageable pageable = PageRequest.of(page, size, sortBy);
        if (startDate != null || endDate != null) {
            return operationUsageHistoryDetailServiceImp.findDetailsByHistoryIdAndStartDateBetween(usageId,startDate, endDate, pageable);
        }
        return operationUsageHistoryDetailServiceImp.getAllUsageDetailsByOperationUsageHistoryId(usageId,page, size, sort);
    }

    @Override
    public Optional<OperationUsageHistory> findById(Long id) {
        return operationUsageHistoryRepository.findById(id);
    }

    @Override
    public OperationUsageHistory createNewEntity(Subscription sub, String connectionName,
                                                 long operationUsage, long startTime,
                                                 String sourceInvoker, String targetInvoker) {

        // Create the parent object - OperationUsageHistory
        OperationUsageHistory operationUsageHistory = new OperationUsageHistory();

        // Set the required fields for OperationUsageHistory
        operationUsageHistory.setSubId(sub.getId());
        operationUsageHistory.setLicenseId(sub.getLicenseId());
        operationUsageHistory.setTotalUsage(operationUsage); // Initialize total usage with requestSize
        operationUsageHistory.setConnectionTitle(connectionName);
        operationUsageHistory.setCreatedAt(LocalDateTime.now());
        operationUsageHistory.setFromInvoker(sourceInvoker);
        operationUsageHistory.setToInvoker(targetInvoker);

        // Create the detail object - OperationUsageHistoryDetail
        OperationUsageHistoryDetail operationUsageHistoryDetail = new OperationUsageHistoryDetail();

        // Set the fields for OperationUsageHistoryDetail
        operationUsageHistoryDetail.setOperationUsage(operationUsage); // This specific usage request
        operationUsageHistoryDetail.setStartDate(Instant.ofEpochMilli(startTime).atZone(ZoneId.of("UTC")).toLocalDateTime());

        // Set the bidirectional relationship
        operationUsageHistoryDetail.setOperationUsageHistory(operationUsageHistory);

        // Add the detail to the parent entity's list of details
        List<OperationUsageHistoryDetail> details = new ArrayList<>();
        details.add(operationUsageHistoryDetail);
        operationUsageHistory.setDetails(details);

        // Return the newly created OperationUsageHistory object, ready to be saved
        return operationUsageHistory;
    }

    @Override
    public Optional<OperationUsageHistory> findByConnectionTitle(String title) {
        return operationUsageHistoryRepository.findByConnectionTitle(title);
    }

    @Override
    public PaginatedDto<OperationUsageHistory, OperationUsageHistoryDto> toPaginatedDto(Page<OperationUsageHistory> page) {
        return new PaginatedDto<OperationUsageHistory, OperationUsageHistoryDto>(page, OperationUsageHistoryDto::new);
    }

    @Override
    public PaginatedDto<OperationUsageHistoryDetail, OperationUsageDetailsDto> toUsageDetailsDto(Page<OperationUsageHistoryDetail> page) {
        return new PaginatedDto<OperationUsageHistoryDetail, OperationUsageDetailsDto>(page, OperationUsageDetailsDto::new);
    }

    //TODO: create a filter class for start and end date
    @Override
    public Page<OperationUsageHistory> findAllByDetailsStartDateBetween(int page, int size,
                                                                        Long startDate, Long endDate, String[] sorts) {

        // Convert Unix timestamps (assumed in seconds) to LocalDateTime if provided, else keep as null.
        LocalDateTime start = startDate != null
                ? LocalDateTime.ofInstant(Instant.ofEpochMilli(startDate), ZoneId.of("UTC"))
                : null;
        LocalDateTime end = endDate != null
                ? LocalDateTime.ofInstant(Instant.ofEpochMilli(endDate), ZoneId.of("UTC"))
                : null;

        Sort.Direction direction = Sort.Direction.fromString(sorts[1]);
        Sort sortBy = Sort.by(direction, sorts[0]);

        Page<OperationUsageHistory> usageHistories = getAllUsage(page,size, sorts);
        List<OperationUsageHistory> filteredList = usageHistories.getContent().stream()
                .peek(history -> {
                    if (history.getDetails() != null) {
                        List<OperationUsageHistoryDetail> filteredDetails = operationUsageHistoryDetailServiceImp
                                .findDetailsByHistoryIdAndStartDateBetween(history.getId(), start, end);
                        long sumUsage = filteredDetails.stream()
                                .mapToLong(OperationUsageHistoryDetail::getOperationUsage)
                                .sum();
                        history.setTotalUsage(sumUsage);
                    }
                })
                .filter(history -> history.getTotalUsage() > 0)  // Only keep records where totalUsage > 0
                .limit(size) // Ensure only the requested page size is returned
                .collect(Collectors.toList());

        return new PageImpl<>(filteredList, PageRequest.of(page, size, sortBy), filteredList.size());
    }

    @Override
    public void incrementUsageByConnectionTitle(Long id, long opsUsage) {
        operationUsageHistoryRepository.incrementUsageByConnectionTitle(id, opsUsage);
    }
}
