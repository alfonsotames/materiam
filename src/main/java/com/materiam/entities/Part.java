/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import java.io.Serializable;
import java.util.Set;

/**
 *
 * @author mufufu
 */
@Entity
public class Part implements Serializable {







    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @ManyToOne
    private Material material;
    private String persid;
    private String prototype;
    private String type;
    private double gauge;
    @Lob
    private String comments;
    @ManyToOne
    private CADFile cadfile;
    private Double dimX;
    private Double dimY;
    private Double dimZ;
    private Long timesRepeated;
    private Double flatTotalContourLength;
    private Double flatObbLength;
    private Double flatObbWidth;
    
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
        if (!(object instanceof Part)) {
            return false;
        }
        Part other = (Part) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.materiam.entities.Part[ id=" + id + " ]";
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
     * @return the material
     */
    public Material getMaterial() {
        return material;
    }

    /**
     * @param material the material to set
     */
    public void setMaterial(Material material) {
        this.material = material;
    }




    /**
     * @return the prototype
     */
    public String getPrototype() {
        return prototype;
    }

    /**
     * @param prototype the prototype to set
     */
    public void setPrototype(String prototype) {
        this.prototype = prototype;
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
     * @return the type
     */
    public String getType() {
        return type;
    }

    /**
     * @param type the type to set
     */
    public void setType(String type) {
        this.type = type;
    }
    /**
     * @return the gauge
     */
    public double getGauge() {
        return gauge;
    }

    /**
     * @param gauge the gauge to set
     */
    public void setGauge(double gauge) {
        this.gauge = gauge;
    }

    /**
     * @return the comments
     */
    public String getComments() {
        return comments;
    }

    /**
     * @param comments the comments to set
     */
    public void setComments(String comments) {
        this.comments = comments;
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
     * @return the dimX
     */
    public double getDimX() {
        return dimX;
    }

    /**
     * @param dimX the dimX to set
     */
    public void setDimX(double dimX) {
        this.dimX = dimX;
    }

    /**
     * @return the dimY
     */
    public double getDimY() {
        return dimY;
    }

    /**
     * @param dimY the dimY to set
     */
    public void setDimY(double dimY) {
        this.dimY = dimY;
    }

    /**
     * @return the dimZ
     */
    public double getDimZ() {
        return dimZ;
    }

    /**
     * @param dimZ the dimZ to set
     */
    public void setDimZ(double dimZ) {
        this.dimZ = dimZ;
    }

    /**
     * @return the timesRepeated
     */
    public Long getTimesRepeated() {
        return timesRepeated;
    }

    /**
     * @param timesRepeated the timesRepeated to set
     */
    public void setTimesRepeated(Long timesRepeated) {
        this.timesRepeated = timesRepeated;
    }

    /**
     * @return the flatTotalContourLength
     */
    public Double getFlatTotalContourLength() {
        return flatTotalContourLength;
    }

    /**
     * @param flatTotalContourLength the flatTotalContourLength to set
     */
    public void setFlatTotalContourLength(Double flatTotalContourLength) {
        this.flatTotalContourLength = flatTotalContourLength;
    }

    /**
     * @return the flatObbLength
     */
    public Double getFlatObbLength() {
        return flatObbLength;
    }

    /**
     * @param flatObbLength the flatObbLength to set
     */
    public void setFlatObbLength(Double flatObbLength) {
        this.flatObbLength = flatObbLength;
    }

    /**
     * @return the flatObbWidth
     */
    public Double getFlatObbWidth() {
        return flatObbWidth;
    }

    /**
     * @param flatObbWidth the flatObbWidth to set
     */
    public void setFlatObbWidth(Double flatObbWidth) {
        this.flatObbWidth = flatObbWidth;
    }


    
}
