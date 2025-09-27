/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.controllers;

import com.materiam.entities.FabProcess;
import com.materiam.entities.Material;
import com.materiam.entities.Part;
import com.materiam.entities.Project;
import jakarta.faces.view.ViewScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.servlet.http.HttpServletRequest;
import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
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
    
    public List<QuotedPart> getQuotedParts() {
        List<QuotedPart> qps = new ArrayList<>();
        List<Part> parts = em.createQuery("SELECT p FROM Part p, CADFile cf, Project pr  where pr=:project and cf.project=pr and p.cadfile=cf").setParameter("project", getProject()).getResultList();
        for (Part p : parts) {
            System.out.println("Part id: "+p.getId());
            QuotedPart qp = new QuotedPart();
            qp.setPart(p);
            if (p.getPartType().getType().equals("SHEET_METAL_FLAT") || p.getPartType().getType().equals("SHEET_METAL_FOLDED")) {
                BigDecimal price = new BigDecimal(0.00);

                BigDecimal volumen;
                volumen = p.getFlatObbLength().divide(BigDecimal.valueOf(1000)).multiply(p.getFlatObbWidth().divide(BigDecimal.valueOf(1000)));
                volumen = volumen.multiply(p.getThickness().divide(BigDecimal.valueOf(1000)));
                System.out.println("VOLUMEN: "+volumen);
                
                price = p.getVolume().divide(BigDecimal.valueOf(1000000000));
                System.out.println("Price 1: "+price);
                price = price.multiply(p.getMaterial().getDensity());
                System.out.println("Price 2: "+price);
                price = price.multiply(p.getMaterial().getPricePerKg());



                // TODO: Determine the cutting process by thickness and max min for each material / process
                FabProcess fp = (FabProcess)em.find(FabProcess.class, 1L);

                // get process time
                System.out.println("p.getFlatTotalContourLength()"+p.getFlatTotalContourLength());
                System.out.println("p.getMaterial().getLaserCuttingSpeed()"+p.getMaterial().getLaserCuttingSpeed());
                BigDecimal pPrice =  p.getFlatTotalContourLength().divide(p.getMaterial().getLaserCuttingSpeed(), 2, RoundingMode.HALF_UP);
                System.out.println("Process Time in Seconds: "+pPrice);
                pPrice = pPrice.multiply((fp.getPriceph().divide(BigDecimal.valueOf(3600), 2, RoundingMode.HALF_UP)));

                System.out.println("Process price: "+pPrice);
                price = price.add(pPrice);
                qp.setPrice(price);

                } else if (p.getPartType().getType().equals("TUBE_RECTANGULAR") ) {
                    BigDecimal price = new BigDecimal(0.00);
                    System.out.println("Volume in mm3 of the tube: "+p.getVolume());
                    price = p.getVolume().divide(BigDecimal.valueOf(1000000000));
                    System.out.println("Volume in m3: "+price);
                    price = price.multiply(p.getMaterial().getDensity());
                    System.out.println("Weight in Kg: "+price);
                    price = price.multiply(p.getMaterial().getPricePerKg());
                    qp.setPrice(price);
                } else {
                    qp.setPrice(new BigDecimal(0));
                }
            qps.add(qp);
        }        
        return qps;
    }
    
    public Project getProject() {
        return (Project)request.getSession().getAttribute("activeProject");
    }
    
    public Material getMaterialByThickness(Double thickness) {
        return (Material)em.createQuery("select m from Material m where m.thickness=:thickness").setParameter("thickness", thickness).getSingleResult();
    }
    
    public void deleteProject() {
        
    }
    
    
    
    public class QuotedPart {
        private Part part;
        private BigDecimal price;
        /**
         * @return the part
         */
        public Part getPart() {
            return part;
        }

        /**
         * @param part the part to set
         */
        public void setPart(Part part) {
            this.part = part;
        }

        /**
         * @return the price
         */
        public BigDecimal getPrice() {
            return price;
        }

        /**
         * @param price the price to set
         */
        public void setPrice(BigDecimal price) {
            this.price = price;
        }  
    }
    
}

