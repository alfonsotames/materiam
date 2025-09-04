/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import java.io.Serializable;

/**
 *
 * @author mufufu
 */
@Entity
public class Instance implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    private CADFile cadfile;
    @ManyToOne
    private Part part;
    private double rotx;
    private double transx;
    

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
        if (!(object instanceof Instance)) {
            return false;
        }
        Instance other = (Instance) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.materiam.entities.Instance[ id=" + id + " ]";
    }

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
     * @return the cadfile
     */
    public CADFile getCadfile() {
        return cadfile;
    }

    /**
     * @param cadfile the cadfile to set
     */
    public void setCadfile(CADFile cadfile) {
        this.cadfile = cadfile;
    }

    /**
     * @return the rotx
     */
    public double getRotx() {
        return rotx;
    }

    /**
     * @param rotx the rotx to set
     */
    public void setRotx(double rotx) {
        this.rotx = rotx;
    }

    /**
     * @return the transx
     */
    public double getTransx() {
        return transx;
    }

    /**
     * @param transx the transx to set
     */
    public void setTransx(double transx) {
        this.transx = transx;
    }



    
}
