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
import java.math.BigDecimal;
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
    private String persid; // Persistance ID (from STEP spec)
    private String prototype; // (from STEP spec)
    @ManyToOne
    private PartType partType; // see PartType
    @Column(precision = 8, scale = 2) //999,999.99 mm
    private BigDecimal thickness;
    
    @Column(precision = 15, scale = 2) //999,999,999,999.99 mm
    private BigDecimal volume;
    @Column(precision = 15, scale = 2) //999,999,999,999.99 mm
    private BigDecimal totalArea;
    
    @Column(precision = 9, scale = 3) //999,999.999 mm
    private BigDecimal sectionWidth;
    @Column(precision = 9, scale = 3) //999,999.999 mm
    private BigDecimal sectionHeight;
    @Column(precision = 9, scale = 3) //999,999.999 mm
    private BigDecimal partLength;

    @Column(precision = 9, scale = 3) //999,999.999 mm
    private BigDecimal dimX;
    @Column(precision = 9, scale = 3) //999,999.999 mm
    private BigDecimal dimY;
    @Column(precision = 9, scale = 3) //999,999.999 mm
    private BigDecimal dimZ;
    @Column(precision = 9, scale = 3) //999,999.999 mm
    private BigDecimal flatTotalContourLength;
    @Column(precision = 9, scale = 3) //999,999.999 mm
    private BigDecimal flatObbLength;
    @Column(precision = 9, scale = 3) //999,999.999 mm
    private BigDecimal flatObbWidth;
    private Long timesRepeated;
    @ManyToOne
    private CADFile cadfile;    
    @Lob
    private String comments;
    
    
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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
     * @return the partType
     */
    public PartType getPartType() {
        return partType;
    }

    /**
     * @param partType the partType to set
     */
    public void setPartType(PartType partType) {
        this.partType = partType;
    }

    /**
     * @return the thickness
     */
    public BigDecimal getThickness() {
        return thickness;
    }

    /**
     * @param thickness the thickness to set
     */
    public void setThickness(BigDecimal thickness) {
        this.thickness = thickness;
    }

    /**
     * @return the volume
     */
    public BigDecimal getVolume() {
        return volume;
    }

    /**
     * @param volume the volume to set
     */
    public void setVolume(BigDecimal volume) {
        this.volume = volume;
    }

    /**
     * @return the totalArea
     */
    public BigDecimal getTotalArea() {
        return totalArea;
    }

    /**
     * @param totalArea the totalArea to set
     */
    public void setTotalArea(BigDecimal totalArea) {
        this.totalArea = totalArea;
    }



    /**
     * @return the sectionWidth
     */
    public BigDecimal getSectionWidth() {
        return sectionWidth;
    }

    /**
     * @param sectionWidth the sectionWidth to set
     */
    public void setSectionWidth(BigDecimal sectionWidth) {
        this.sectionWidth = sectionWidth;
    }

    /**
     * @return the sectionHeight
     */
    public BigDecimal getSectionHeight() {
        return sectionHeight;
    }

    /**
     * @param sectionHeight the sectionHeight to set
     */
    public void setSectionHeight(BigDecimal sectionHeight) {
        this.sectionHeight = sectionHeight;
    }

    /**
     * @return the partLength
     */
    public BigDecimal getPartLength() {
        return partLength;
    }

    /**
     * @param partLength the partLength to set
     */
    public void setPartLength(BigDecimal partLength) {
        this.partLength = partLength;
    }

    /**
     * @return the dimX
     */
    public BigDecimal getDimX() {
        return dimX;
    }

    /**
     * @param dimX the dimX to set
     */
    public void setDimX(BigDecimal dimX) {
        this.dimX = dimX;
    }

    /**
     * @return the dimY
     */
    public BigDecimal getDimY() {
        return dimY;
    }

    /**
     * @param dimY the dimY to set
     */
    public void setDimY(BigDecimal dimY) {
        this.dimY = dimY;
    }

    /**
     * @return the dimZ
     */
    public BigDecimal getDimZ() {
        return dimZ;
    }

    /**
     * @param dimZ the dimZ to set
     */
    public void setDimZ(BigDecimal dimZ) {
        this.dimZ = dimZ;
    }

    /**
     * @return the flatTotalContourLength
     */
    public BigDecimal getFlatTotalContourLength() {
        return flatTotalContourLength;
    }

    /**
     * @param flatTotalContourLength the flatTotalContourLength to set
     */
    public void setFlatTotalContourLength(BigDecimal flatTotalContourLength) {
        this.flatTotalContourLength = flatTotalContourLength;
    }

    /**
     * @return the flatObbLength
     */
    public BigDecimal getFlatObbLength() {
        return flatObbLength;
    }

    /**
     * @param flatObbLength the flatObbLength to set
     */
    public void setFlatObbLength(BigDecimal flatObbLength) {
        this.flatObbLength = flatObbLength;
    }

    /**
     * @return the flatObbWidth
     */
    public BigDecimal getFlatObbWidth() {
        return flatObbWidth;
    }

    /**
     * @param flatObbWidth the flatObbWidth to set
     */
    public void setFlatObbWidth(BigDecimal flatObbWidth) {
        this.flatObbWidth = flatObbWidth;
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

    
    
    
    
    
    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {

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



    
}
