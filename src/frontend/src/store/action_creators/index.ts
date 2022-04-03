/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import Application from "@action/application";
import Connection from "@action/connection";
import Dashboard from "@action/dashboard";
import ExternalApplication from "@action/external_application";
import Schedule from "@action/schedule";
import ConnectorCreators from "@action/ConnectorCreators";
import InvokerCreators from "@action/InvokerCreators";
import UserCreators from "@action/UserCreators";
import UserGroupCreators from "@action/UserGroupCreators";

export default {
    ...Application,
    ...Connection,
    ...Dashboard,
    ...ExternalApplication,
    ...Schedule,
    ...ConnectorCreators,
    ...InvokerCreators,
    ...UserCreators,
    ...UserGroupCreators,
}