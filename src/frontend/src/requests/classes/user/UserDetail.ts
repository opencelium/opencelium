
import {IUserDetail} from "@interface/user/IUserDetail";

export class UserDetailRequest{
    static backendMap(userDetail: Partial<IUserDetail>){
        return {
            appTour: userDetail.appTour,
            department: userDetail.department,
            lang: "eng",
            name: userDetail.name,
            organization: userDetail.organization,
            phoneNumber: userDetail.phoneNumber,
            profilePicture: userDetail.profilePicture,
            surname: userDetail.surname,
            theme: userDetail.theme,
            userTitle: userDetail.userTitle,

        };
    }
}