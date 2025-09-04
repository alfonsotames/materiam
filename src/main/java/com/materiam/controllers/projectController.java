/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.controllers;

import com.materiam.entities.Part;
import com.materiam.entities.Project;
import jakarta.faces.view.ViewScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.servlet.http.HttpServletRequest;
import java.io.Serializable;
import java.util.List;

/**
 *
 * @author mufufu
 */

@Named(value = "projectcontroller")
@ViewScoped
public class projectController implements Serializable {
    @Inject
    private HttpServletRequest request;
        
    @PersistenceContext(unitName = "materiam")
    private EntityManager em;
    
    public List<Part> getParts() {
        System.out.println("Retrieving parts...");
        List<Part> parts = em.createQuery("SELECT p FROM Part p, CADFile cf, Project pr  where pr=:project and cf.project=pr and p.cadfile=cf").setParameter("project", getProject()).getResultList();
        for (Part p : parts) {
            System.out.println("Part id: "+p.getId());
        }
        return parts;
    }
    
    public Project getProject() {
        return (Project)request.getSession().getAttribute("activeProject");
    }
    
}
