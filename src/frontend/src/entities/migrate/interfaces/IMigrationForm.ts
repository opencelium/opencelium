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

import {IForm} from "@application/interfaces/core";
import {MigrateRequestProps} from "@entity/migrate/requests/interfaces/IMigrate";

export interface IMigrationSwitch{
}

export interface IMigrationFile{
}

export interface IMigrationTextarea{
}

export interface IMigrationSelect{
}

export interface IMigrationRadios{
}

export interface IMigrationText extends MigrateRequestProps{

}

export default interface IMigrationForm extends IMigrationText, IMigrationSelect, IMigrationRadios, IMigrationFile, IMigrationSwitch, IForm<IMigrationText, IMigrationSelect, IMigrationRadios, IMigrationFile, IMigrationTextarea, IMigrationSwitch>{
    migrate: () => boolean;
}
