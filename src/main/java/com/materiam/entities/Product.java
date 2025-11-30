/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.entities;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PersistenceContext;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;


// TODO: EXPERIMENT - Product
/**
 * Product
 * -----------------------------------------------------------------------------
 *
 * A datatype to hold any kind of entity that can represent a wide range of economical units.
 * From raw material to finished products, consumables, third party products, etc.
 * A Product can integrate a BOM.
 * 
 * When a product is sourced into the inventory it will do so through a Lot (from 1 to n)
 * that will provide tracing and certificates of origin/quality/etc.
 * 
 * A product can be an assembly of other products!
 * 
 * 
 * 
 * For numerical properties and string properties:
 * 
 * @Entity
 * public class Example {
 *     @Id long id;
 *     // ....
 *     @ElementCollection
 *     @MapKeyColumn(name="name")
 *     @Column(name="value")
 *     @CollectionTable(name="example_attributes", joinColumns=@JoinColumn(name="example_id"))
 *     Map<String, String> attributes = new HashMap<String, String>(); maps from attribute name to value
 * }
 * 
 * Expected behavior: 
 * 
 * Map <String,BigDecimal> properties 
 * 
 * Product p = getProdut();
 * 
 * 
 * BigDecimal w = p.getProperties.get("width")
 * 
 * String format   = p.getAttributes.get("format"); // SHEET_METAL_FLAT
 * 
 * 
 * 
 * @author mufufu
 */




@Entity
public class Product implements Serializable {

        
    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String sku;
    private Unit unit; // g mm cm unit kg/m³
    
    /* TODO: Falta integrar grupos de properties (alloys, etc.)
    
    
    */        
    
    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "product_id")
    private List<Property> properties = new ArrayList<>();
    

    @ManyToMany(mappedBy = "products",cascade = CascadeType.PERSIST)
    private Set<Category> categories = new HashSet<>();
  
    @OneToMany(cascade = CascadeType.PERSIST)
    private List<Product> assembly;
    


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {

        if (!(object instanceof Product)) {
            return false;
        }
        Product other = (Product) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.materiam.entities.Product[ id=" + id + " ]";
    }

    /**
     * @return the name
     */
    public String getName() {
        return name;
    }

    /**
     * @param name the name to set
     */
    public void setName(String name) {
        this.name = name;
    }


    /**
     * @return the assembly
     */
    public List<Product> getAssembly() {
        return assembly;
    }

    /**
     * @param assembly the assembly to set
     */
    public void setAssembly(List<Product> assembly) {
        this.assembly = assembly;
    }


    /**
     * @return the sku
     */
    public String getSku() {
        return sku;
    }

    /**
     * @param sku the sku to set
     */
    public void setSku(String sku) {
        this.sku = sku;
    }


    /**
     * @param properties the properties to set
     */
    public void setProperties(List<Property> properties) {
        this.setProperties(properties);
    }

    /**
     * @return the unit
     */
    public Unit getUnit() {
        return unit;
    }

    /**
     * @param unit the unit to set
     */
    public void setUnit(Unit unit) {
        this.unit = unit;
    }

    /**
     * @return the categories
     */
    public Set<Category> getCategories() {
        return categories;
    }

    /**
     * @param categories the categories to set
     */
    public void setCategories(Set<Category> categories) {
        this.categories = categories;
    }

    /**
     * @return the properties
     */
    public List<Property> getProperties() {
        return properties;
    }




}
