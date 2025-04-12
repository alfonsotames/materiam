/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/J2EE/EJB40/StatelessEjbClass.java to edit this template
 */
package com.materiam.sessions;

import com.materiam.entities.User;
import jakarta.ejb.Stateless;
import jakarta.ejb.LocalBean;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.io.Serializable;

/**
 *
 * @author mufufu
 */
@Stateless
@LocalBean
public class UserController implements Serializable {

    // Add business logic below. (Right-click in editor and choose
    // "Insert Code > Add Business Method")
    @PersistenceContext(unitName = "materiam")
    private EntityManager em;
    
    public boolean createUser(User user) {
        boolean flag = false;
        try {
            em.persist(user);
            flag = true;
        } catch (Exception e) {
        }
        return flag;
    }    
    
}
