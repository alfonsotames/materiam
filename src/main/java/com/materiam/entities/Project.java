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
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import java.io.Serializable;
import java.util.Date;
import java.util.List;
import java.util.Set;

/**
 *
 * @author mufufu
 */
@Entity
public class Project implements Serializable {

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



    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL)
    private List<CADFile> cadfiles;
    
    @Temporal(TemporalType.TIMESTAMP)
    private Date postedDate;
    private String name;
    private boolean saved;
    private String uuid;
    
    
    
    
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
    
    


    /**
     * @return the postedDate
     */
    public Date getPostedDate() {
        return postedDate;
    }

    /**
     * @param postedDate the postedDate to set
     */
    public void setPostedDate(Date postedDate) {
        this.postedDate = postedDate;
    }
    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {

        if (!(object instanceof Project)) {
            return false;
        }
        Project other = (Project) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.materiam.entities.Project[ id=" + id + " ]";
    }

    /**
     * @return the saved
     */
    public boolean isSaved() {
        return saved;
    }

    /**
     * @param saved the saved to set
     */
    public void setSaved(boolean saved) {
        this.saved = saved;
    }

    /**
     * @return the cadfiles
     */
    public List<CADFile> getCadfiles() {
        return cadfiles;
    }

    /**
     * @param cadfiles the cadfiles to set
     */
    public void setCadfiles(List<CADFile> cadfiles) {
        this.cadfiles = cadfiles;
    }
    
}
