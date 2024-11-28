/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.database.mysql.entity.SecretKey;
import com.becon.opencelium.backend.database.mysql.repository.RequestDataRepository;
import com.becon.opencelium.backend.database.mysql.repository.SecretKeyRepository;
import com.becon.opencelium.backend.exception.WrongDecryptException;
import com.becon.opencelium.backend.utility.crypto.Encoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RequestDataServiceImp implements RequestDataService {

    private final RequestDataRepository requestDataRepository;
    private final SecretKeyRepository secretKeyRepository;
    private final Encoder encoder;

    public RequestDataServiceImp(RequestDataRepository requestDataRepository, SecretKeyRepository secretKeyRepository, Encoder encoder) {
        this.requestDataRepository = requestDataRepository;
        this.secretKeyRepository = secretKeyRepository;
        this.encoder = encoder;
    }

    @Override
    public Optional<RequestData> findByConnectorIdAndField(int connectorId, String field) {
        return requestDataRepository.findByConnectorIdAndField(connectorId, field);
    }

    @Override
    public List<RequestData> saveAll(List<RequestData> requestData) {
        return requestDataRepository.saveAll(requestData);
    }

    private void encrypt(RequestData requestData) {
        if (requestData != null) {
            requestData.setValue(encoder.encrypt(requestData.getValue()));
        }
    }

    private void decrypt(RequestData requestData) {
        if (requestData != null) {
            requestData.setValue(encoder.decrypt(requestData.getValue()));
        }
    }

    @Override
    public void prepare() {
        List<RequestData> all = requestDataRepository.findAll();
        Optional<SecretKey> curr = secretKeyRepository.getSecretKey();
        String oldSK;
        boolean changed = false;
        if (curr.isPresent()) {
            oldSK = curr.get().getSecretKey();
            String newSK = encoder.getSecretKey();
            if (!oldSK.equals(newSK)) {
                changed = true;
                Encoder customEncoder = new Encoder(oldSK);
                for (RequestData requestData : all) {
                    try {
                        requestData.setValue(customEncoder.decrypt(requestData.getValue()));
                        requestDataRepository.save(requestData);
                    } catch (Exception ignored) {
                    }
                }
                secretKeyRepository.deleteAll();
                secretKeyRepository.save(new SecretKey(newSK));
            }
        } else{
            secretKeyRepository.save(new SecretKey(encoder.getSecretKey()));
        }

        for (RequestData requestData : all) {
            if (changed) {
                encrypt(requestData);
                requestDataRepository.save(requestData);
                continue;
            }
            try {
                decrypt(requestData);
            } catch (WrongDecryptException e) {
                encrypt(requestData);
                requestDataRepository.save(requestData);
            }
        }
    }
}
