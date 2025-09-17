/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.io.Serializable;
import jakarta.persistence.Column;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import java.math.BigDecimal;

/**
 *
 * @author mufufu
 */
@Entity
public class Material implements Serializable {


    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String code;
    @ManyToOne
    private MaterialFamily materialFamily;
    private String name;
    private String description;
    private String gauge;
    
    @Column(precision = 8, scale = 2) //999,999.99 mm
    private BigDecimal diameter;
    
    @Column(precision = 8, scale = 2) //999,999.99 mm
    private BigDecimal width;
    @Column(precision = 8, scale = 2) //999,999.99 mm
    private BigDecimal length;
    
    @Column(precision = 5, scale = 2) //999.99 mm
    private BigDecimal thickness;
    
    @Column(precision = 7, scale = 2) //99,999.99 - 7850kg/m3
    private BigDecimal density;
    
    @Column(precision = 10, scale = 6) // $1.543234 Kg x 20 tons: $30,864.68
    private BigDecimal pricePerKg;
    @Column(precision = 6, scale = 2) // 28.5 mm/s
    private BigDecimal laserCuttingSpeed;
    @Column(precision = 6, scale = 2) // 28.5 mm/s
    private BigDecimal wjCuttingSpeed;
    @Column(precision = 6, scale = 2) // 28.5 mm/s
    private BigDecimal plasmaCuttingSpeed;

    /**
     * @return the id
     */
    public Long getId() {
        return id;
    }

    /**
     * @param id the id to set
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * @return the code
     */
    public String getCode() {
        return code;
    }

    /**
     * @param code the code to set
     */
    public void setCode(String code) {
        this.code = code;
    }

    /**
     * @return the materialFamily
     */
    public MaterialFamily getMaterialFamily() {
        return materialFamily;
    }

    /**
     * @param materialFamily the materialFamily to set
     */
    public void setMaterialFamily(MaterialFamily materialFamily) {
        this.materialFamily = materialFamily;
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
     * @return the description
     */
    public String getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * @return the gauge
     */
    public String getGauge() {
        return gauge;
    }

    /**
     * @param gauge the gauge to set
     */
    public void setGauge(String gauge) {
        this.gauge = gauge;
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
     * @return the width
     */
    public BigDecimal getWidth() {
        return width;
    }

    /**
     * @param width the width to set
     */
    public void setWidth(BigDecimal width) {
        this.width = width;
    }

    /**
     * @return the length
     */
    public BigDecimal getLength() {
        return length;
    }

    /**
     * @param length the length to set
     */
    public void setLength(BigDecimal length) {
        this.length = length;
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
     * @return the density
     */
    public BigDecimal getDensity() {
        return density;
    }

    /**
     * @param density the density to set
     */
    public void setDensity(BigDecimal density) {
        this.density = density;
    }

    /**
     * @return the pricePerKg
     */
    public BigDecimal getPricePerKg() {
        return pricePerKg;
    }

    /**
     * @param pricePerKg the pricePerKg to set
     */
    public void setPricePerKg(BigDecimal pricePerKg) {
        this.pricePerKg = pricePerKg;
    }

    /**
     * @return the laserCuttingSpeed
     */
    public BigDecimal getLaserCuttingSpeed() {
        return laserCuttingSpeed;
    }

    /**
     * @param laserCuttingSpeed the laserCuttingSpeed to set
     */
    public void setLaserCuttingSpeed(BigDecimal laserCuttingSpeed) {
        this.laserCuttingSpeed = laserCuttingSpeed;
    }

    /**
     * @return the wjCuttingSpeed
     */
    public BigDecimal getWjCuttingSpeed() {
        return wjCuttingSpeed;
    }

    /**
     * @param wjCuttingSpeed the wjCuttingSpeed to set
     */
    public void setWjCuttingSpeed(BigDecimal wjCuttingSpeed) {
        this.wjCuttingSpeed = wjCuttingSpeed;
    }

    /**
     * @return the plasmaCuttingSpeed
     */
    public BigDecimal getPlasmaCuttingSpeed() {
        return plasmaCuttingSpeed;
    }

    /**
     * @param plasmaCuttingSpeed the plasmaCuttingSpeed to set
     */
    public void setPlasmaCuttingSpeed(BigDecimal plasmaCuttingSpeed) {
        this.plasmaCuttingSpeed = plasmaCuttingSpeed;
    }


 
    
    
    
    @Override
    public int hashCode() {
        int hash = 0;
        hash += (getId() != null ? getId().hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Material)) {
            return false;
        }
        Material other = (Material) object;
        if ((this.getId() == null && other.getId() != null) || (this.getId() != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.materiam.entities.Material[ id=" + getId() + " ]";
    }    
    
}
