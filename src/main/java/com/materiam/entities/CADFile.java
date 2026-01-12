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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import java.io.Serializable;
import java.util.Set;
import java.util.List;

/**
 *
 * @author mufufu
 */
@Entity
public class CADFile implements Serializable {

    /**
     * @return the root
     */
    public Assembly getRoot() {
        return root;
    }

    /**
     * @param root the root to set
     */
    public void setRoot(Assembly root) {
        this.root = root;
    }


    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String uuid;
    
    //@ManyToOne
    private Project project;
    @OneToMany(mappedBy = "cadfile", cascade = CascadeType.ALL)
    private Set<Part> parts;
    private Assembly root;
    
    
    

    
    /**
     * @return the project
     */
    public Project getProject() {
        return project;
    }

    /**
     * @param project the project to set
     */
    public void setProject(Project project) {
        this.project = project;
    }
    
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

        if (!(object instanceof CADFile)) {
            return false;
        }
        CADFile other = (CADFile) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.materiam.entities.CadFile[ id=" + id + " ]";
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
     * @return the parts
     */
    public Set<Part> getParts() {
        return parts;
    }

    /**
     * @param parts the parts to set
     */
    public void setParts(Set<Part> parts) {
        this.parts = parts;
    }



    /**
     * @return the uuid
     */
    public String getUuid() {
        return uuid;
    }

    /**
     * @param uuid the uuid to set
     */
    public void setUuid(String uuid) {
        this.uuid = uuid;
    }


    
}
