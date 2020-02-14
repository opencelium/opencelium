/*
 * // Copyright (C) <2019> <becon GmbH>
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

//package com.becon.opencelium.backend.mysql.repository;

//import com.becon.opencelium.backend.mysql.entity.Template;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.stereotype.Repository;
//
//import java.util.List;
//import java.util.Optional;
//
//@Repository
//public interface TemplateRepository extends JpaRepository<Template, Integer> {
//
//    boolean existsByName(String name);
//    List<Template> findByFromInvokerAndToInvoker(String fromInvoker, String toInvoker);
//    Optional<Template> findByIdAndFromInvokerAndToInvoker(int id, String fromInvoker, String toInvoker);
//}
