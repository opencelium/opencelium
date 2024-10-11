/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */



import {disableTotp, enableTotp, validateTotp} from "@entity/totp/redux_toolkit/action_creators/TotpCreators";

export default {
    fulfilled: {
        [enableTotp.fulfilled.type]: "The TFA was successfully activated.",
        [disableTotp.fulfilled.type]: "The TFA was successfully deactivated.",
    },
    rejected: {
        [validateTotp.rejected.type]: {
            "__NATIVE__": "-",
        },
        [enableTotp.rejected.type]: {
            "__NATIVE__": "-",
        },
        [disableTotp.rejected.type]: {
            "__NATIVE__": "-",
        }
    },
}
