package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.ExtraOps;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.subscription.dto.EncryptedExtraOpsFile;
import com.becon.opencelium.backend.subscription.dto.ExtraOpsDTO;
import com.becon.opencelium.backend.subscription.dto.LicenseKey;

import java.util.List;
import java.util.Optional;

public interface ExtraOpsService {

    EncryptedExtraOpsFile decrypt(String content);

    void save(ExtraOps extraOps);

    void delete(Long id);

    void deleteList(List<Long> ids);

    Optional<ExtraOps> findById(long extraOpsId);

    ExtraOpsDTO toDTO(ExtraOps extraOps);

    ExtraOps toEntityFromEncryption(EncryptedExtraOpsFile encryptedExtraOpsFile);

    void update(ExtraOps extraOps);

    void updateExtraOpsForSubscription(Subscription sub, long opsUsage);

    String constructHmac(ExtraOps extraOps, long usage);
    String constructHmac(EncryptedExtraOpsFile encryptExtraOps, long usage);

    boolean existsByGeneratedAt(long generatedAt);
}
