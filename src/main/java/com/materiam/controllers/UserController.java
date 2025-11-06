/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/J2EE/EJB40/StatelessEjbClass.java to edit this template
 */
package com.materiam.controllers;

import com.materiam.entities.User;
import jakarta.enterprise.context.SessionScoped;
import jakarta.faces.application.FacesMessage;
import jakarta.faces.context.FacesContext;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.security.enterprise.AuthenticationStatus;
import static jakarta.security.enterprise.AuthenticationStatus.SEND_CONTINUE;
import static jakarta.security.enterprise.AuthenticationStatus.SEND_FAILURE;
import static jakarta.security.enterprise.AuthenticationStatus.SUCCESS;
import jakarta.security.enterprise.SecurityContext;
import static jakarta.security.enterprise.authentication.mechanism.http.AuthenticationParameters.withParams;
import jakarta.security.enterprise.credential.Credential;
import jakarta.security.enterprise.credential.UsernamePasswordCredential;
import jakarta.security.enterprise.identitystore.IdentityStoreHandler;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import java.io.IOException;
import java.io.Serializable;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author mufufu


UserController is sessionScoped in order to make the User bean available
to all jsf's and controllers. We could store the user in the FacesContext:
     
     FacesContext context = FacesContext.getCurrentInstance();
      context.getExternalContext().getSessionMap().put("user", current);

But it has a very deep hierarchy.
 * 
 * 
 */
@Named(value = "userController")
@SessionScoped
@Transactional
public class UserController implements Serializable {



    
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

    @Inject
    private ProjectController projectController;
  
    private String loginEmail;
    private String loginPassw;
    private User user = null;

    public String logout() {
        try {
            request.logout();
        } catch (ServletException e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Can't logout: {0}", e.getMessage());
        }
        context.getExternalContext().invalidateSession();
        try {
            context.getExternalContext().redirect(request.getContextPath() + "/");
        } catch (IOException ex) {
            System.getLogger(UserController.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
        }
        return null;
    }

    public String login() {
        try {
            
            Logger.getLogger(this.getClass().getName()).log(Level.INFO, "Trying login in for : {0}", loginEmail);

            Credential credential = new UsernamePasswordCredential(loginEmail, loginPassw);

            Logger.getLogger(this.getClass().getName()).log(Level.INFO, "* - * - * - * - * - * - Invocando el Authenticate * - * - * - * - * - * - ");
            AuthenticationStatus status = securityContext.authenticate(
                    getRequest(context),
                    getResponse(context),
                    withParams()
                            .credential(credential));
            Logger.getLogger(this.getClass().getName()).log(Level.INFO, "* - * - * - * - * - * - Authenticate invocado  * - * - * - * - * - * - ");
            setUser((User) em.createQuery("select u from User u where u.email=:email").setParameter("email", loginEmail).getSingleResult());
            
            Logger.getLogger(this.getClass().getName()).log(Level.INFO, "status equals {0}", status);
            if (status.equals(SEND_CONTINUE)) {
                Logger.getLogger(this.getClass().getName()).log(Level.INFO,"* * * SEND_CONTINUE * * * *");
                context.responseComplete();
                
                
                Logger.getLogger(this.getClass().getName()).log(Level.INFO,"* * * Setting user {0} * * * *", user.getName());
            } else if (status.equals(SUCCESS)) {
                
                if (projectController.getActiveProject() == null) {
                    System.out.println(" >>>>>>>>>>>>>>>>>>>>>>>>>> activeProject is null!!!!!!!");
                } else {
                    projectController.getActiveProject().setSaved(true);
                    user.getProjects().add(projectController.getActiveProject());
                    
                }


                
                return "account/index.xhtml";
            } else if (status.equals(SEND_FAILURE)) {
                Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "*** racaso al autentificar ***");
                return "login.xhtml";
            }

        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "*** Error while login User ***",e);
        }
        return "/";
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


    
}
