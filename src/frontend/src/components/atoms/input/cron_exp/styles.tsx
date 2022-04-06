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

import styled from "styled-components";
import {EmphasizeInputStyleLines} from "../styles";
import { ElementProps} from "../interfaces";
import {CronSuffixStyledProps, SelectProps} from "@atom/input/cron_exp/interfaces";
import InputSelect from "@atom/input/select/InputSelect";
import {Text} from "@atom/text/Text";

const InputCronExpStyled = styled.input<ElementProps>`
    background: ${({background}) => background ? background : 'unset'};
    outline: none;
    border: none;
    cursor: ${({readOnly}) => readOnly ? 'default' : 'text'};
    border-bottom: ${({value}) => !value || value.toString().length === 0 ? '1px solid #c1c1c1' : 'none'};
    transition: border-bottom-color 0.5s;
    padding-left: ${({paddingLeft, paddingLeftInput}) => paddingLeftInput ? paddingLeftInput : paddingLeft || 0};
    padding-right: ${({paddingRight, paddingRightInput}) => paddingRightInput ? paddingRightInput : paddingRight || 0};
    padding-top: ${({paddingTop, theme}) => paddingTop || theme.input.inputElement.paddingTop || 0};
    padding-bottom: ${({theme}) => theme.input.inputElement.paddingBottom || 0};
    width: ${({width, isIconInside, hasIcon, theme}) => width ? width : isIconInside || !hasIcon ? '100%' : `calc(100% - ${theme.input.iconInputDistance})`};
    margin-left: ${({marginLeft, hasIcon, isIconInside, theme}) => marginLeft ? marginLeft : !hasIcon || isIconInside ? 0 : theme.input.iconInputDistance};
    margin-top: ${({marginTop}) => marginTop || 0};
    height: ${({height}) => height || 'auto'};
    ${EmphasizeInputStyleLines}
`;

const ExampleStyled = styled.ol`
    text-align: center;
    font-size: 16px;
    list-style-position: inside;
    margin-top: 10px;
    padding: 0;
`;

const CronGeneratorStyled = styled.span<ElementProps>`
    position: absolute;
    right: 6px;
    top: 20px;
    margin-top: ${({marginTop, paddingTop}) => marginTop || paddingTop || 0};
    &:focus, &:focus-within{
         outline: none;
    }
`;

const EachStyled = styled(Text)`
    float: left;
    width: 15%;
    margin-right: 1%;
    text-align: center;
    font-size: 18px;
    line-height: 24px;
`;

const CronEverySelectStyled = styled(InputSelect)<SelectProps>`
    float: left;
    width: ${({dayShow}) => dayShow ? '15%' : '22%'};
    margin-right: 1%;
`;

const CronDayForMonthStyled = styled(InputSelect)<SelectProps>`
    float: left;
    margin-right: 1%;
    width: 22%;
`;

const SuffixDayForMonthStyled = styled(Text)`
    text-align: center;
    font-size: 14px;
    line-height: 24px;
    float: left;
    margin-right: 1%;
    width: 8%;
`;

const EveryForWeekSelectStyled = styled(InputSelect)<SelectProps>`
    float: left;
    margin-right: 1%;
    width: ${({isForWeek, dayShow}) => isForWeek ? '34%' : dayShow ? '20%' : '23%'};
`;

const OfAStyled = styled(Text)`
    float: left;
    width: 7%;
    margin-right: 1%;
    text-align: center;
    font-size: 18px;
    line-height: 24px;
`;

const CronTimeStampStyled = styled(InputSelect)<SelectProps>`
    float: left;
    margin-right: 1%;
    width: ${({isForWeek, dayShow}) => isForWeek ? '36%' : dayShow ? '30%' : '32%'};
`

const CronSuffixStyled = styled.span<CronSuffixStyledProps>`
    float: left;
    width: ${({dayShow}) => dayShow ? 0 : '20%'};
    text-align: center;
    font-size: 18px;
    line-height: 24px;
`;

const CronStartAtSelectStyled = styled(InputSelect)<SelectProps>`
    float: left;
    width: 17%;
    margin-right: 1%;
`;

const CronStartHourSelectStyled = styled(InputSelect)<SelectProps>`
    float: left;
    width: 33%;
`;

const CronSuffixHourStyled = styled(Text)`
    text-align: center;
    font-size: 14px;
    line-height: 24px;
    float: left;
    width: 6%;
`;

const CronStartMinuteSelectStyled = styled(InputSelect)<SelectProps>`
    float: left;
    width: 33%;
`;

const CronSuffixMinuteStyled = styled(Text)`
    text-align: center;
    font-size: 14px;
    line-height: 24px;
    float: left;
    width: 5%;
`;

export {
    InputCronExpStyled,
    ExampleStyled,
    EachStyled,
    CronEverySelectStyled,
    CronDayForMonthStyled,
    SuffixDayForMonthStyled,
    EveryForWeekSelectStyled,
    OfAStyled,
    CronTimeStampStyled,
    CronSuffixStyled,
    CronStartAtSelectStyled,
    CronStartHourSelectStyled,
    CronSuffixHourStyled,
    CronStartMinuteSelectStyled,
    CronSuffixMinuteStyled,
    CronGeneratorStyled,
}