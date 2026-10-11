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

package com.becon.opencelium.backend.database.mysql.entity;

import com.becon.opencelium.backend.enums.AuthMethod;
import com.becon.opencelium.backend.resource.user.UserResource;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import org.hibernate.annotations.LazyCollection;
import org.hibernate.annotations.LazyCollectionOption;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "email")
    private String email;

    @Column(name = "username")
    private String username;

    @Column(name = "password")
    private String password;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER, mappedBy = "user")
    private Session session;

    @OneToOne(cascade = {CascadeType.ALL}, fetch = FetchType.EAGER, mappedBy = "user")
    private UserDetail userDetail;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private UserRole userRole;

    @Column(name = "auth_method", nullable = false)
    @Enumerated(EnumType.STRING)
    private AuthMethod authMethod = AuthMethod.BASIC;

    @Column(name = "totp_process_completed", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean totpProcessCompleted; // set to 'true' after first successful login with new TOTP secretKey

    @Column(name = "totp_secret_key")
    private String totpSecretKey; // created when admin does 'enable' action

    /**
     * Identity the account is linked to at its identity provider: the issuer together with the
     * subject of the ID token. Both stay null for accounts that never signed in through OpenID
     * Connect, so a login is only ever matched by email when weak matching was switched on.
     */
    @Column(name = "oidc_issuer")
    private String oidcIssuer;

    @Column(name = "oidc_subject")
    private String oidcSubject;

    @LazyCollection(LazyCollectionOption.FALSE)
    @OneToMany(cascade = CascadeType.ALL,  mappedBy = "user")
    private List<WidgetSetting> widgetSettings = new ArrayList<>();

    public User() {
    }

    public User(UserResource userResource, List<WidgetSetting> widgetSettings) {
        this.id = userResource.getUserId();
        this.email = userResource.getEmail();
        this.username = userResource.getUsername();
        this.userDetail = new UserDetail(userResource.getUserDetail());
        this.userRole = new UserRole(userResource.getUserGroup());
        this.widgetSettings = widgetSettings;
    }

    public String getPrincipal() {
        return email != null ? email : username;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Session getSession() {
        return session;
    }

    public void setSession(Session session) {
        this.session = session;
    }

    public UserDetail getUserDetail() {
        return userDetail;
    }

    public void setUserDetail(UserDetail userDetail) {
        this.userDetail = userDetail;
    }

    public UserRole getUserRole() {
        return userRole;
    }

    public void setUserRole(UserRole userRole) {
        this.userRole = userRole;
    }

    public AuthMethod getAuthMethod() {
        return authMethod;
    }

    public void setAuthMethod(AuthMethod authMethod) {
        this.authMethod = authMethod;
    }

    public boolean isTotpProcessCompleted() {
        return totpProcessCompleted;
    }

    public void setTotpProcessCompleted(boolean totpProcessCompleted) {
        this.totpProcessCompleted = totpProcessCompleted;
    }

    public String getTotpSecretKey() {
        return totpSecretKey;
    }

    public void setTotpSecretKey(String totpSecretKey) {
        this.totpSecretKey = totpSecretKey;
    }

    public String getOidcIssuer() {
        return oidcIssuer;
    }

    public void setOidcIssuer(String oidcIssuer) {
        this.oidcIssuer = oidcIssuer;
    }

    public String getOidcSubject() {
        return oidcSubject;
    }

    public void setOidcSubject(String oidcSubject) {
        this.oidcSubject = oidcSubject;
    }

    public List<WidgetSetting> getWidgetSettings() {
        return widgetSettings;
    }

    public void setWidgetSettings(List<WidgetSetting> widgetSettings) {
        this.widgetSettings = widgetSettings;
    }
}
