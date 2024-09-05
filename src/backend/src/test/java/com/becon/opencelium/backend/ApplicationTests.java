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
		String lk = "vGVDzpQGLoN5OjhHYuZBON0Mj6o1fZ0mUJR6v3FicsfAVKTwkVD7paJ1qdWd8FTftxg6uNIpVWIuMv4PRwgCGc4IdrzQdvGHy7JbfrkfJJHD7XMN6MBEFJ7nVUibDMaYhaSeHBaB68k2+oh0NVgYfegQRvnb/fsj7BYA5fvKnDCLaSAshGF0rtFCkFHa0/CkONvKUfJO1jEKq6jdbMEc4TZABNIsJ0+hYKB2HJhXHAUeFLaewh/khDMn/WXIGoS3szxb2Exs1uP+QBOR5E+GSewrJR09e9ZAANVcNjYe/2EjJukV3Xa7MHfwBF97FOZNWoyOwjNY3MmrOtrNzh89Og==";
		LicenseKeyUtility.decrypt(lk);
	}
}
