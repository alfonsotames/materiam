/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.entities;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import java.io.Serializable;
import java.math.BigDecimal;

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
    // TODO: Delete this property 
    @ManyToOne
    private Product material;
    
    
    
    
    private String persid; // Persistance ID (from STEP spec)
    private String prototype; // (from STEP spec)
    @ManyToOne
    private Category shape; //
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
    private BigDecimal diameter;
    @Column(precision = 9, scale = 3) //999,999.999 mm
    private BigDecimal dimX;
    @Column(precision = 9, scale = 3) //999,999.999 mm
    private BigDecimal dimY;
    @Column(precision = 9, scale = 3) //999,999.999 mm
    private BigDecimal dimZ;
    
    /*
    The total cutting length computed as a sum of all segment lengths
    in the flat pattern (depends on K-factor), including inner holes
    and cutouts.
    */
    @Column(precision = 9, scale = 3) //999,999.999 mm
    private BigDecimal flatTotalContourLength;
    
    /*
    The length of the optimized position of the flat pattern for a
    sheet metal body.
    */
    @Column(precision = 9, scale = 3) //999,999.999 mm
    private BigDecimal flatObbLength;
    
    /*
    The width of the optimized position of the flat pattern for a
    sheet metal body.
    */    
    @Column(precision = 9, scale = 3) //999,999.999 mm
    private BigDecimal flatObbWidth;
    private Long bends;
    private Long timesRepeated;
    @ManyToOne
    private CADFile cadfile;
    @Lob
    private String comments;

    @Column(precision = 10, scale = 2) // Manual price override
    private BigDecimal manualPrice;

    // Simulation results from amatix
    private Boolean hasCollisions;  // Part is infeasible if true
    private Boolean hasWarnings;    // Part has manufacturing warnings
    @Lob
    private String simulationWarnings;  // JSON array of warning messages
    
    
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
    /**
     * @return the bends
     */
    public Long getBends() {
        return bends;
    }

    /**
     * @param bends the bends to set
     */
    public void setBends(Long bends) {
        this.bends = bends;
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

    /**
     * @return the shape
     */
    public Category getShape() {
        return shape;
    }

    /**
     * @param shape the shape to set
     */
    public void setShape(Category shape) {
        this.shape = shape;
    }

    /**
     * @return the material
     */
    public Product getMaterial() {
        return material;
    }

    /**
     * @param material the material to set
     */
    public void setMaterial(Product material) {
        this.material = material;
    }

    /**
     * @return the diameter
     */
    public BigDecimal getDiameter() {
        return diameter;
    }

    /**
     * @param diameter the diameter to set
     */
    public void setDiameter(BigDecimal diameter) {
        this.diameter = diameter;
    }

    /**
     * @return the manualPrice
     */
    public BigDecimal getManualPrice() {
        return manualPrice;
    }

    /**
     * @param manualPrice the manualPrice to set
     */
    public void setManualPrice(BigDecimal manualPrice) {
        this.manualPrice = manualPrice;
    }

    /**
     * @return true if the part has collisions (infeasible)
     */
    public Boolean getHasCollisions() {
        return hasCollisions;
    }

    /**
     * @param hasCollisions the hasCollisions to set
     */
    public void setHasCollisions(Boolean hasCollisions) {
        this.hasCollisions = hasCollisions;
    }

    /**
     * @return true if the part has manufacturing warnings
     */
    public Boolean getHasWarnings() {
        return hasWarnings;
    }

    /**
     * @param hasWarnings the hasWarnings to set
     */
    public void setHasWarnings(Boolean hasWarnings) {
        this.hasWarnings = hasWarnings;
    }

    /**
     * @return the simulation warnings as JSON array string
     */
    public String getSimulationWarnings() {
        return simulationWarnings;
    }

    /**
     * @param simulationWarnings the simulationWarnings to set
     */
    public void setSimulationWarnings(String simulationWarnings) {
        this.simulationWarnings = simulationWarnings;
    }
}
