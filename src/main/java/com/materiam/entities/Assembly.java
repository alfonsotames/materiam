/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.entities;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author mufufu
 */
@Entity
public class Assembly implements Serializable {

    /**
     * @return the parent
     */
    public Assembly getParent() {
        return parent;
    }

    /**
     * @param parent the parent to set
     */
    public void setParent(Assembly parent) {
        this.parent = parent;
    }

    /**
     * @return the instances
     */
    public List<Instance> getInstances() {
        return instances;
    }

    /**
     * @param instances the instances to set
     */
    public void setInstances(List<Instance> instances) {
        this.instances = instances;
    }



    private static final long serialVersionUID = 1L;

    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String persid;
    private String name;

    @ManyToOne
    private Assembly parent;  // Add parent reference for bidirectional relationship

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assembly> assemblies = new ArrayList<>();
    
    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "assembly_id")  // Unidirectional, or add @ManyToOne in Part
    private List<Part> parts = new ArrayList<>();

    @OneToMany(mappedBy = "assembly", cascade = CascadeType.ALL)
    private List<Instance> instances;
    
    
    
    
    
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
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Assembly)) {
            return false;
        }
        Assembly other = (Assembly) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.materiam.entities.Assembly[ id=" + id + " ]";
    }

    /**
     * @return the assemblies
     */
    public List<Assembly> getAssemblies() {
        return assemblies;
    }

    /**
     * @param assemblies the assemblies to set
     */
    public void setAssemblies(List<Assembly> assemblies) {
        this.assemblies = assemblies;
    }

    /**
     * @return the parts
     */
    public List<Part> getParts() {
        return parts;
    }

    /**
     * @param parts the parts to set
     */
    public void setParts(List<Part> parts) {
        this.parts = parts;
    }
    /**
     * @return the persid
     */
    public String getPersid() {
        return persid;
    }

    /**
     * @param persid the persid to set
     */
    public void setPersid(String persid) {
        this.persid = persid;
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
    
}
