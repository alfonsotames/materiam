/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.controllers;


import com.materiam.entities.Category;
import com.materiam.entities.Product;
import com.materiam.entities.Property;
import com.materiam.entities.Unit;
import jakarta.annotation.PostConstruct;
import jakarta.faces.application.FacesMessage;
import jakarta.faces.context.FacesContext;
import jakarta.faces.view.ViewScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import java.io.Serializable;
import java.util.List;
import org.primefaces.event.CellEditEvent;

/**
 *
 * @author mufufu
 */
@Named(value = "productController")
@ViewScoped
@Transactional
public class ProductController implements Serializable {
    
    @Inject
    private HttpServletRequest request;
        
    @PersistenceContext(unitName = "materiam")
    private EntityManager em;
    
    private Product currentProduct;
    private List<Category> categories;
    private List<Category> selectedCategories;
    
    
    
    @PostConstruct
    public void init() {
        currentProduct = new Product();
        categories = em.createQuery("select cat from Category cat").getResultList();
    }
    
    
    public void save() {
        System.out.println("Save Current Product:"+currentProduct.getName());
        if (currentProduct.getId() == null) {
            em.persist(currentProduct);
        } else {
            em.merge(currentProduct);
        }
    }
    
    public void test() {
        
        Product p = new Product();
        p.setName("Steel Metal Sheet A36 Cold Rolled 10 Ga.");
        p.setSku("SM_ST_A36_10GA");

        
        Property width = em.find(Property.class, 2L);
        Property length = em.find(Property.class, 3L);
        Property height = em.find(Property.class, 4L);

        em.persist(p);
        

    }
    
    public List<Product> getProducts() {        
        List<Product> products = em.createQuery("select p from Product p").getResultList();
        return products;
    }
    
    public List<Unit> getUnits() {
        List<Unit> units = em.createQuery("select u from Unit u").getResultList();
        return units;
    }
    
    public List<Category> getCategories() {
        List<Category> categories = em.createQuery("select cat from Category cat").getResultList();
        return categories;
    }
    
    public List<Property> getProperties() {
        List<Property> properties = em.createQuery("select pro from Property pro").getResultList();
        return properties;
    }
    
    /**
     * @return the currentProduct
     */
    public Product getCurrentProduct() {
        return currentProduct;
    }

    /**
     * @param currentProduct the currentProduct to set
     */
    public void setCurrentProduct(Product currentProduct) {
        this.currentProduct = currentProduct;
    }

    /**
     * @param categories the categories to set
     */
    public void setCategories(List<Category> categories) {
        this.categories = categories;
    }

    /**
     * @return the selectedCategories
     */
    public List<Category> getSelectedCategories() {
        return selectedCategories;
    }

    /**
     * @param selectedCategories the selectedCategories to set
     */
    public void setSelectedCategories(List<Category> selectedCategories) {
        this.selectedCategories = selectedCategories;
    }




    
}
