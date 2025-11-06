/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.controllers;

import com.materiam.entities.Material;
import com.materiam.entities.MaterialType;
import com.materiam.entities.MaterialFormat;
import jakarta.annotation.PostConstruct;
import jakarta.faces.application.FacesMessage;
import jakarta.faces.context.FacesContext;
import jakarta.faces.view.ViewScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import java.io.Serializable;
import java.util.List;
import org.primefaces.event.CellEditEvent;
import org.primefaces.event.RowEditEvent;

/**
 *
 * @author mufufu
 */
@Named(value = "materialController")
@ViewScoped
@Transactional
public class MaterialController implements Serializable {
    @Inject
    private HttpServletRequest request;
        
    @PersistenceContext(unitName = "materiam")
    private EntityManager em;
    
    private List<Material> materials;
    private List<MaterialType> materialTypes;
    private List<MaterialFormat> materialFormats;
    
    private Material newMaterial;
    private MaterialType mtFilter;
    private MaterialFormat mfFilter;
    
    
    
    
    @PostConstruct
    public void init() {
        newMaterial = new Material();
    }

    public void saveNewMaterial() {
        newMaterial.setMaterialFormat(mfFilter);
        newMaterial.setMaterialType(mtFilter);
        em.persist(newMaterial);

        updateFilter();

    }
    
    public void deleteMaterial(Material m) {
        em.remove(em.find(Material.class, m.getId()));
        updateFilter();
    }
    
    public void updateFilter() {
        String jpql = "select m from Material m where 1=1";
        
        if (mtFilter != null) {
            jpql+=" AND m.materialType=:mtFilter";
        }
        if (getMfFilter() != null) {
            jpql+=" AND m.materialFormat =:mfFilter";
        }
        
        jpql += " order by m.id desc";
        Query query = em.createQuery(jpql.toString());
        
        if (mtFilter != null) {
            query.setParameter("mtFilter", mtFilter);
        }
        if (getMfFilter() != null) {
            query.setParameter("mfFilter", getMfFilter());
        }        
        materials = query.getResultList();
    }
    
    public List<Material> getMaterials() {
        //System.out.println("Get Materials was called");        
        if (materials == null) {
            //System.out.println("materials was null, calling database...");
            materials = em.createQuery("select m from Material m order by m.id desc").getResultList();
            return materials;
        }
        return materials;
    }
    
    public List<MaterialType> getMaterialTypes() {
        //System.out.println("Get Material Types was called");
        if (materialTypes == null) {
            //System.out.println("material types was null, calling database...");
            materialTypes = em.createQuery("select mt from MaterialType mt order by mt.id").getResultList();
            return materialTypes;
        }
        return materialTypes;
        
    }


    public List<MaterialFormat> getMaterialFormats() {
        //System.out.println("Get types");
        if (materialFormats == null) {
            materialFormats = em.createQuery("select mf from MaterialFormat mf order by mf.id").getResultList();
            return materialFormats;
        }
        return materialFormats;
    }

    

    public void onRowEdit(RowEditEvent<Material> event) {
        FacesMessage msg = new FacesMessage("Product Edited", String.valueOf(event.getObject().getCode()));
        FacesContext.getCurrentInstance().addMessage(null, msg);
    }

    public void onRowCancel(RowEditEvent<Material> event) {
        FacesMessage msg = new FacesMessage("Edit Cancelled", String.valueOf(event.getObject().getCode()));
        FacesContext.getCurrentInstance().addMessage(null, msg);
    }

    public void onCellEdit(CellEditEvent event) {
        System.out.println("* - * - onCellEdit - * - *");
        Object oldValue = event.getOldValue();
        Object newValue = event.getNewValue();



        if (newValue != null) {
                    System.out.println("Class: "+event.getNewValue().getClass());
        System.out.println("new Value: "+event.getNewValue());
        System.out.println("old Value: "+event.getOldValue());

            
            
            Material mat = (Material)event.getRowData();
            System.out.println("mat: "+mat.getName());
            System.out.println("Updated id "+mat.getId()+" name: "+mat.getName()+" materialtype: "
                                                +mat.getMaterialType().getId()+" materialType name: "
                                                +mat.getMaterialType().getName());
            em.merge(mat);
            FacesMessage msg = new FacesMessage(FacesMessage.SEVERITY_INFO, "Updated Material "+mat.getId()+": "+mat.getName(), "Old: " 
                                                        + oldValue + ", New:" + newValue);
            FacesContext.getCurrentInstance().addMessage(null, msg);
        } else {
            System.out.println("newValue is NUUUUUUULLLLLLLLL");
            System.out.println("Old value: "+oldValue);
        }
    }

    /**
     * @return the mtFilter
     */
    public MaterialType getMtFilter() {
        return mtFilter;
    }

    /**
     * @param mtFilter the mtFilter to set
     */
    public void setMtFilter(MaterialType mtFilter) {
        this.mtFilter = mtFilter;
    }

    /**
     * @return the mfFilter
     */
    public MaterialFormat getMfFilter() {
        return mfFilter;
    }

    /**
     * @param mfFilter the mfFilter to set
     */
    public void setMfFilter(MaterialFormat mfFilter) {
        this.mfFilter = mfFilter;
    }

    /**
     * @return the newMaterial
     */
    public Material getNewMaterial() {
        return newMaterial;
    }

    /**
     * @param newMaterial the newMaterial to set
     */
    public void setNewMaterial(Material newMaterial) {
        this.newMaterial = newMaterial;
    }




    
}
