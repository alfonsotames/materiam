/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.controllers;


import com.materiam.entities.Role;
import com.materiam.entities.User;
import jakarta.ejb.Stateless;
import jakarta.enterprise.context.RequestScoped;
import jakarta.enterprise.context.SessionScoped;
import jakarta.enterprise.inject.spi.CDI;
import jakarta.faces.application.FacesMessage;
import jakarta.faces.context.FacesContext;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.security.enterprise.AuthenticationStatus;
import static jakarta.security.enterprise.AuthenticationStatus.SEND_CONTINUE;
import static jakarta.security.enterprise.AuthenticationStatus.SEND_FAILURE;
import jakarta.security.enterprise.SecurityContext;
import static jakarta.security.enterprise.authentication.mechanism.http.AuthenticationParameters.withParams;
import jakarta.security.enterprise.credential.Credential;
import jakarta.security.enterprise.credential.UsernamePasswordCredential;
import jakarta.security.enterprise.identitystore.IdentityStoreHandler;
import jakarta.security.enterprise.identitystore.Pbkdf2PasswordHash;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;


/**
 *
 * @author mufufu
 */

@Named(value = "createUserController")
@RequestScoped
@Transactional


public class CreateUserController implements Serializable {
    
    @Inject
    private LoginController loginController;

    @PersistenceContext(unitName = "materiam")
    private EntityManager em;
    private User newUser = new User();
    
    public void createUser() {
        
        Logger.getLogger(this.getClass().getName()).log(Level.INFO,
                "Creating user: {0}", newUser.getEmail());
        
        try {
            newUser.setPassword(hashPassword(newUser.getPassword()));
            Role role = em.find(Role.class, 2l);
            List roles = new ArrayList<Role>();
            roles.add(role);
            newUser.setRoles(roles);
            em.persist(newUser);
            loginController.setUser(newUser);
            //Logger.getLogger(this.getClass().getName()).log(Level.INFO, "Now the user is: {0}", getUser().toString());
            
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, 
                    "*** Error while persisting User ***",e);
                        FacesContext.getCurrentInstance().addMessage("", 
                                new FacesMessage(FacesMessage.SEVERITY_ERROR, 
                                        "Hay un fuerte error" + e.getMessage(),""));
        }
        
        Logger.getLogger(this.getClass().getName()).log(Level.INFO, "*** User Persisted ***");
    }        
        
    

    public static String hashPassword(String plainPassword) {
        // Create the hasher manually
        Pbkdf2PasswordHash hasher = CDI.current().select(Pbkdf2PasswordHash.class).get();
        

        // Set custom parameters
        Map<String, String> parameters = new HashMap<>();
        parameters.put("Pbkdf2PasswordHash.Iterations", "2048");
        parameters.put("Pbkdf2PasswordHash.Algorithm", "PBKDF2WithHmacSHA256");
        parameters.put("Pbkdf2PasswordHash.SaltSizeBytes", "32");
        
        // Initialize with those parameters
        hasher.initialize(parameters);

        // Generate the password hash
        return hasher.generate(plainPassword.toCharArray());
    }
    
    /**
     * @return the newUser
     */
    public User getNewUser() {
        return newUser;
    }

    /**
     * @param newUser the newUser to set
     */
    public void setNewUser(User newUser) {
        this.newUser = newUser;
    }
    

    
    
    
}
