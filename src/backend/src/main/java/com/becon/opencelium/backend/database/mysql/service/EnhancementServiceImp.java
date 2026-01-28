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

import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.repository.EnhancementRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class EnhancementServiceImp implements EnhancementService {

    private final EnhancementRepository enhancementRepository;

    public EnhancementServiceImp(EnhancementRepository enhancementRepository) {
        this.enhancementRepository = enhancementRepository;
    }

    @Override
    public Optional<Enhancement> findById(Integer enhId) {
        if (enhId == null) return Optional.empty();
        return enhancementRepository.findById(enhId);
    }

    @Override
    public void deleteAll() {
        enhancementRepository.deleteAll();
    }
}
