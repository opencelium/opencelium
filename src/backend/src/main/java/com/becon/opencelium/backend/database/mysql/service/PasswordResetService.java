package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.resource.user.PasswordLinkResource;

public interface PasswordResetService {
    void requestReset(String email, String clientIp);

    void resetPassword(String rawToken, String newPassword);

    /**
     * Issues a one-time link with which an OC user sets a new password, on an admin's behalf. The
     * link leads to the same page as a self-service reset and is used up the same way, through
     * {@link #resetPassword(String, String)}. Every token the user still holds is invalidated
     * first, so only the newest link works. The user's password and session stay as they are
     * until the link is used, and two-factor login is not affected.
     *
     * @param userId    the user the link is for
     * @param issuedBy  id of the admin issuing it, recorded with the token
     * @param sendEmail whether to also mail the link to the user
     * @return the link, carrying the raw token, and its expiry; only the token's hash is stored
     * @throws com.becon.opencelium.backend.exception.UserNotFoundException if no user has the id
     * @throws com.becon.opencelium.backend.exception.GeneralServiceException with status 400 and
     *     {@code PASSWORD_MANAGED_EXTERNALLY} if the user signs in through LDAP, or
     *     {@code EMAIL_NOT_FOUND} if {@code sendEmail} is set but the user has no email
     * @throws com.becon.opencelium.backend.exception.ServiceUnavailableException with
     *     {@code EMAIL_RECOVERY_FAILED} if the email could not be sent; nothing is stored then
     */
    PasswordLinkResource issueAdminLink(int userId, int issuedBy, boolean sendEmail);
}
