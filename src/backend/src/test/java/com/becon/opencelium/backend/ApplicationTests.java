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

package com.becon.opencelium.backend;


import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.database.mysql.service.ActivationRequestServiceImp;
import com.becon.opencelium.backend.mapper.mysql.ActivationRequestMapper;
import com.becon.opencelium.backend.subscription.dto.ActivationRequestDTO;
import com.becon.opencelium.backend.subscription.remoteapi.RemoteApi;
import com.becon.opencelium.backend.subscription.remoteapi.RemoteApiFactory;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiModule;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiType;
import com.becon.opencelium.backend.subscription.remoteapi.module.SubscriptionModule;
import com.becon.opencelium.backend.subscription.utility.LicenseKeyUtility;
import com.becon.opencelium.backend.utility.crypto.Base64Utility;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class ApplicationTests {

	@Test
	public void contextLoads() {
	}
}
