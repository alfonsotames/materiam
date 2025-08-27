package com.materiam.config;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.security.enterprise.identitystore.DatabaseIdentityStoreDefinition;
import jakarta.security.enterprise.identitystore.Pbkdf2PasswordHash;
import jakarta.annotation.security.DeclareRoles;
import jakarta.annotation.sql.DataSourceDefinition;
import jakarta.faces.annotation.FacesConfig;
import jakarta.security.enterprise.authentication.mechanism.http.BasicAuthenticationMechanismDefinition;
import jakarta.security.enterprise.authentication.mechanism.http.CustomFormAuthenticationMechanismDefinition;
import jakarta.security.enterprise.authentication.mechanism.http.FormAuthenticationMechanismDefinition;
import jakarta.security.enterprise.authentication.mechanism.http.LoginToContinue;
import java.sql.Connection;

@DataSourceDefinition(
    name = "java:app/jdbc/materiam",
    className = "org.postgresql.ds.PGSimpleDataSource",
    user = "materiam",
    password = "katiusha",
    databaseName = "materiam",
    serverName = "localhost",
    portNumber = 5432,
    isolationLevel = Connection.TRANSACTION_READ_COMMITTED,
    minPoolSize = 2,
    maxPoolSize = 20,
    initialPoolSize = 2
)

@DatabaseIdentityStoreDefinition(
    dataSourceLookup = "java:app/jdbc/materiam",
    callerQuery = "#{'SELECT password FROM users WHERE email = ?'}",
    groupsQuery = "#{'select r.roleName from role as r, users_role as ur, users as u where u.email = ? and ur.user_id=u.id and r.id=ur.roles_id'}",
    hashAlgorithm = Pbkdf2PasswordHash.class,
    priorityExpression = "#{100}",
    hashAlgorithmParameters = {
        "Pbkdf2PasswordHash.Iterations=2048",
        "Pbkdf2PasswordHash.Algorithm=PBKDF2WithHmacSHA256",
        "Pbkdf2PasswordHash.SaltSizeBytes=32"
    }
)

@DeclareRoles({"ADMIN", "USER"})


@CustomFormAuthenticationMechanismDefinition(
  loginToContinue = @LoginToContinue(loginPage = "/login.xhtml", useForwardToLogin = false, errorPage = "/login.xhtml"))
@FacesConfig
@ApplicationScoped
public class ApplicationConfig {
    // No methods needed
}
