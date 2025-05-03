/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/J2EE/EJB40/StatelessEjbClass.java to edit this template
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
import jakarta.security.enterprise.SecurityContext;
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
@Named(value = "newuserController")
@RequestScoped
@Transactional
public class newuserController {


    
    @Inject
    private SecurityContext securityContext;
    @Inject
    private HttpServletRequest request;

    @Inject
    private FacesContext context;    
    
    @PersistenceContext(unitName = "materiam")
    private EntityManager em;

    @Inject
    private IdentityStoreHandler identityStoreHandler;    

    private User newUser = new User();
    private User user = new User();
    private String loginEmail;
    private String loginPassw;

    public void createUser() {
        try {

            Logger.getLogger(this.getClass().getName()).log(Level.INFO, "*** User Persisted ***");
            newUser.setPassword(hashPassword(newUser.getPassword()));
            Role role = em.find(Role.class, 2l);
            List roles = new ArrayList<Role>();
            roles.add(role);
            newUser.setRoles(roles);
            em.persist(newUser);        
            setUser(newUser);
            newUser = new User();
            Logger.getLogger(this.getClass().getName()).log(Level.INFO, "Now the user is: {0}", getUser().toString());
            
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "*** Error while persisting User ***",e);
                        FacesContext.getCurrentInstance().addMessage("", new FacesMessage(FacesMessage.SEVERITY_ERROR, "Hay un fuerte error" + e.getMessage(),""));
        }

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
    
    
    private static HttpServletResponse getResponse(FacesContext context) {
        return (HttpServletResponse) context
                .getExternalContext()
                .getResponse();
    }

    private static HttpServletRequest getRequest(FacesContext context) {
        return (HttpServletRequest) context
                .getExternalContext()
                .getRequest();
    }
    /**
     * @return the user
     */
    public User getUser() {
        return user;
    }

    /**
     * @param user the user to set
     */
    public void setUser(User user) {
        this.user = user;
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
    /**
     * @return the loginEmail
     */
    public String getLoginEmail() {
        return loginEmail;
    }

    /**
     * @param loginEmail the loginEmail to set
     */
    public void setLoginEmail(String loginEmail) {
        this.loginEmail = loginEmail;
    }

    /**
     * @return the loginPassw
     */
    public String getLoginPassw() {
        return loginPassw;
    }

    /**
     * @param loginPassw the loginPassw to set
     */
    public void setLoginPassw(String loginPassw) {
        this.loginPassw = loginPassw;
    }

    
}
