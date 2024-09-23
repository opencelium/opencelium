package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;
import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistoryDetail;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.database.mysql.repository.OperationUsageHistoryRepository;
import com.becon.opencelium.backend.resource.subs.OperationUsageHistoryDto;
import com.becon.opencelium.backend.resource.subs.OperationUsageDetailsDto;
import com.becon.opencelium.backend.resource.subs.PaginatedDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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
    public Page<OperationUsageHistory> getAllUsage(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return operationUsageHistoryRepository.findAll(pageable);
    }

    @Override
    public Page<OperationUsageHistoryDetail> getAllUsageDetails(int page, int size) {
        return operationUsageHistoryDetailServiceImp.getAllUsageDetails(page, size);
    }

    @Override
    public Optional<OperationUsageHistory> findById(Long id) {
        return operationUsageHistoryRepository.findById(id);
    }

    @Override
    public OperationUsageHistory createNewEntity(Subscription sub, String connectionName, long operationUsage, long startTime) {

        // Create the parent object - OperationUsageHistory
        OperationUsageHistory operationUsageHistory = new OperationUsageHistory();

        // Set the required fields for OperationUsageHistory
        operationUsageHistory.setSubId(sub.getId());
        operationUsageHistory.setLicenseId(sub.getLicenseId());
        operationUsageHistory.setTotalUsage(operationUsage); // Initialize total usage with requestSize
        operationUsageHistory.setConnectionTitle(connectionName);
        operationUsageHistory.setCreatedAt(LocalDateTime.now());

        // Create the detail object - OperationUsageHistoryDetail
        OperationUsageHistoryDetail operationUsageHistoryDetail = new OperationUsageHistoryDetail();

        // Set the fields for OperationUsageHistoryDetail
        operationUsageHistoryDetail.setOperationUsage(operationUsage); // This specific usage request
        operationUsageHistoryDetail.setStartDate(Instant.ofEpochMilli(startTime).atZone(ZoneId.systemDefault()).toLocalDateTime());

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
}
