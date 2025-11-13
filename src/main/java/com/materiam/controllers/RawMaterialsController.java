/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.controllers;


import com.materiam.entities.Category;
import com.materiam.entities.Product;
import com.materiam.entities.Property;
import com.materiam.entities.PropertyType;
import com.materiam.entities.Unit;
import com.materiam.helpers.RawMaterial;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.primefaces.event.CellEditEvent;
import org.primefaces.event.RowEditEvent;

/**
 *
 * @author mufufu
 */
@Named(value = "rawMaterialController")
@ViewScoped
@Transactional
public class RawMaterialsController implements Serializable {
    @Inject
    private HttpServletRequest request;
        
    @PersistenceContext(unitName = "materiam")
    private EntityManager em;
    
    private List<RawMaterial> rawMaterials;
    private RawMaterial newRawMaterial;
    
    private List<Category> alloys;
    private List<Category> shapes;
    
    //Filters
    private Category shapeFilter;
    private Category alloyFilter;

    /*
    
            Property w = newRawMaterial.getWidth();
        Property l = newRawMaterial.getWidth();
        Property h = newRawMaterial.getWidth();
        Property t = newRawMaterial.getWidth();
        Property d = newRawMaterial.getWidth();
        Property den = newRawMaterial.getWidth();
        Property ppk = newRawMaterial.getWidth();
        Category alloy = newRawMaterial.getAlloy();
        Category shape = newRawMaterial.getShape();
        w.setProduct(np);
        l.setProduct(np);
        h.setProduct(np);
        t.setProduct(np);
        d.setProduct(np);
        den.setProduct(np);
        ppk.setProduct(np);
        alloy.set
        shape.setProduct(np);
    */
    
    public void saveNewRawMaterial() {
        System.out.println("********** SAVE NEW RAW MATERIAL *************");
        System.out.println("Filter Alloy: "+alloyFilter.getName());
        System.out.println("Filter Shape: "+shapeFilter.getName());


        Category alloy = em.find(Category.class, alloyFilter.getId());
        Category shape = em.find(Category.class, shapeFilter.getId());
        
        
        
        newRawMaterial.setAlloy(alloy);
        newRawMaterial.setShape(shape);
        
        Unit u = em.find(Unit.class, 1L);
        newRawMaterial.getProduct().setUnit(u);

        System.out.println("Persisting new product: "+newRawMaterial.getProduct().getName());
        
        Set<Category> cats = new HashSet<>();
        cats.add(shape);
        cats.add(alloy);
        alloy.getProducts().add(newRawMaterial.getProduct());
        shape.getProducts().add(newRawMaterial.getProduct());
        
        newRawMaterial.getProduct().setCategories(cats);
        
        /*
        np.getProperties().add(w);
        System.out.println("Mide "+np.getProperties().size());
        np.getProperties().add(l);
        System.out.println("Mide "+np.getProperties().size());
        np.getProperties().add(h);
        System.out.println("Mide "+np.getProperties().size());
        np.getProperties().add(t);
        System.out.println("Mide "+np.getProperties().size());
        np.getProperties().add(d);
        System.out.println("Mide "+np.getProperties().size());
        np.getProperties().add(den);
        System.out.println("Mide "+np.getProperties().size());
        np.getProperties().add(ppk);
        System.out.println("Mide "+np.getProperties().size());
        //np.getCategories().add(alloy);
        //np.getCategories().add(shape);
        alloy.getProducts().add(np);
        shape.getProducts().add(np);
        */
        /* --- borrame --- */
        
        System.out.println("Properties and Categories !");
        for (Property p : newRawMaterial.getProduct().getProperties()) {
            System.out.println(p.getPropertyType().getName()+" = "+p.getValue());
        }
        
        for (Category c : newRawMaterial.getProduct().getCategories()) {
            System.out.println(c.getName());
        }
        
        /* --------------- */        
        
        em.persist(newRawMaterial.getProduct());
        em.merge(alloy);
        em.merge(shape);
        newRawMaterial=initNewRawMaterial();
        updateFilter();
        
    }
    
    public void deleteRawMaterial(Product rm) {
        System.out.println("Attempting to remove "+rm.getName());
        Product p = (Product)em.find(Product.class, rm.getId());
        p.getCategories().clear();
        em.persist(p);
        em.remove(em.find(Product.class, p.getId()));
        updateFilter();
    }
    
    public void onCellEdit(CellEditEvent event) {
        System.out.println("* - * - onCellEdit - * - *");
        Object oldValue = event.getOldValue();
        Object newValue = event.getNewValue();
        
        if (newValue != null) {
            System.out.println("Class: "+event.getNewValue().getClass());
            System.out.println("new Value: "+event.getNewValue());
            System.out.println("old Value: "+event.getOldValue());
            
            RawMaterial rm = (RawMaterial)event.getRowData();
            System.out.println("Attempting to update "+rm.getProduct().getName());
            for (Property p : rm.getProduct().getProperties()) {
                System.out.println("Property: "+p.getPropertyType().getName()+" = "+p.getValue());
            }
            em.merge(rm.getProduct());
            FacesMessage msg = new FacesMessage(FacesMessage.SEVERITY_INFO, "Updated Material "+rm.getProduct().getId()+": "+rm.getProduct().getName(), "Old: " 
                                                        + oldValue + ", New:" + newValue);
            FacesContext.getCurrentInstance().addMessage(null, msg);            
        }        
    }
    
    public void updateFilter() {
        rawMaterials = new ArrayList<>();
        
        String jpql = "select DISTINCT p, w, l, h, t, d, den, ppk, alloy, shape "
                + " from Product p, Property w, Property l, Property h, "
                + "Property t, Property d, Property den, Property ppk, Category alloy, Category shape, Category metal where "
                + "w.propertyType.key='WIDTH' and p.properties = w and "
                + "l.propertyType.key='LENGTH' and p.properties = l and "
                + "h.propertyType.key='HEIGHT' and p.properties = h and " 
                + "t.propertyType.key='THICKNESS' and p.properties = t and "
                + "d.propertyType.key='DIAMETER' and p.properties = d and "
                + "den.propertyType.key='DENSITY' and p.properties = den and "
                + "ppk.propertyType.key='PRICEPERKG' and p.properties = ppk and "
                + "shape.parent.key='GARS' and  p.categories = shape and alloy.parent.key='ALLOY' and p.categories = alloy ";
        
        if (getShapeFilter() != null) {
            jpql+="AND shape = :shapeFilter ";
        }        
        if (alloyFilter != null) {
            jpql+="AND alloy = :alloyFilter ";
        }
        jpql += " order by p.id desc";
        //System.out.println("Query: "+jpql);
        Query query = em.createQuery(jpql.toString());
        
        if (getShapeFilter() != null) {
            query.setParameter("shapeFilter", getShapeFilter());
        }        
        if (alloyFilter != null) {
            query.setParameter("alloyFilter", alloyFilter);
        }        
        
        List<Object[]> res = query.getResultList();
        
        for (Object[] row : res) {
            Product p = (Product) row[0];
            Property w = (Property) row[1];
            Property l = (Property) row[2];
            Property h = (Property) row[3];
            Property t = (Property) row[4];
            Property d = (Property) row[5];
            Property den = (Property) row[6];
            Property ppk = (Property) row[7];
            Category alloy = (Category) row[8];
            Category shape = (Category) row[9];

            RawMaterial rm = new RawMaterial();
            rm.setProduct(p);
            rm.setWidth(w);
            rm.setLength(l);
            rm.setHeight(h);
            rm.setThickness(t);
            rm.setDiameter(d);
            rm.setDensity(den); 
            rm.setPriceperkg(ppk);
            rm.setAlloy(alloy);
            rm.setShape(shape);
            
            rawMaterials.add(rm);
        }
    newRawMaterial.setAlloy(alloyFilter);
    newRawMaterial.setShape(shapeFilter);
    }
    
    @PostConstruct
    public void init() {
        this.newRawMaterial = initNewRawMaterial();
        updateFilter();
    }

    public RawMaterial initNewRawMaterial() {
        RawMaterial nrm = new RawMaterial();
        Property width  = initPropertyByType("WIDTH");
        Property length = initPropertyByType("LENGTH");
        Property height = initPropertyByType("HEIGHT");
        Property thickn = initPropertyByType("THICKNESS");
        Property diamet = initPropertyByType("DIAMETER");
        Property densit = initPropertyByType("DENSITY");
        Property prppkg = initPropertyByType("PRICEPERKG");
        
        Product p = new Product();

        
        
        nrm.setProduct(p);
        
        width.setProduct(p);
        length.setProduct(p);
        height.setProduct(p);
        thickn.setProduct(p);
        diamet.setProduct(p);
        densit.setProduct(p);
        prppkg.setProduct(p);
        
        
        nrm.setWidth(width);
        nrm.setLength(length);
        nrm.setHeight(height);
        nrm.setThickness(thickn);
        nrm.setDiameter(diamet);
        nrm.setDensity(densit);
        nrm.setPriceperkg(prppkg);
        
        
        nrm.getProduct().getProperties().add(width);
        nrm.getProduct().getProperties().add(length);
        nrm.getProduct().getProperties().add(height);
        nrm.getProduct().getProperties().add(thickn);
        nrm.getProduct().getProperties().add(diamet);
        nrm.getProduct().getProperties().add(densit);
        nrm.getProduct().getProperties().add(prppkg);
        nrm.getProduct().getCategories().add(shapeFilter);
        nrm.getProduct().getCategories().add(alloyFilter);
        nrm.setShape(shapeFilter);
        nrm.setAlloy(alloyFilter);
        
        return nrm;
    }
    
    public Property initPropertyByType(String type) {
        PropertyType pt = (PropertyType) em.createQuery("select pt from "
                + "PropertyType pt where pt.key=:type").setParameter("type", type).getSingleResult();
        Property p = new Property();
        p.setPropertyType(pt);
        return p;
    }
    
    /**
     * @return the rawMaterials
     */
    public List<RawMaterial> getRawMaterials() {
        return rawMaterials;
    }

    /**
     * @param rawMaterials the rawMaterials to set
     */
    public void setRawMaterials(List<RawMaterial> rawMaterials) {
        this.rawMaterials = rawMaterials;
    }

    /**
     * @return the newRawMaterial
     */
    public RawMaterial getNewRawMaterial() {
        return newRawMaterial;
    }

    /**
     * @param newRawMaterial the newRawMaterial to set
     */
    public void setNewRawMaterial(RawMaterial newRawMaterial) {
        this.newRawMaterial = newRawMaterial;
    }

    /**
     * @return the alloyFilter
     */
    public Category getAlloyFilter() {
        return alloyFilter;
    }

    /**
     * @param alloyFilter the alloyFilter to set
     */
    public void setAlloyFilter(Category alloyFilter) {
        this.alloyFilter = alloyFilter;
    }

    /**
     * @return the shapeFilter
     */
    public Category getShapeFilter() {
        return shapeFilter;
    }

    /**
     * @param shapeFilter the shapeFilter to set
     */
    public void setShapeFilter(Category shapeFilter) {
        this.shapeFilter = shapeFilter;
    }

    /**
     * @return the alloys
     */
    public List<Category> getAlloys() {
        if (alloys == null) {
            alloys = em.createQuery("select a from Category a where a.parent.key='ALLOY'").getResultList();
        }
        return alloys;
    }

    /**
     * @param alloys the alloys to set
     */
    public void setAlloys(List<Category> alloys) {
        this.alloys = alloys;
    }

    /**
     * @return the shapes
     */
    public List<Category> getShapes() {
        shapes = em.createQuery("select sh from Category sh where sh.parent.key='GARS'").getResultList();
        return shapes;
    }

    /**
     * @param shapes the shapes to set
     */
    public void setShapes(List<Category> shapes) {
        this.shapes = shapes;
    }



    
}
