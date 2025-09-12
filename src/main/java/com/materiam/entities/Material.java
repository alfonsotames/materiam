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
    private String name;
    private String description;
    private Double thickness;
    private Double density;
    private Double pricePerKg;
    private Double cuttingSpeed; // !!! remove from here
    private Process process;// !!! remove from here
    
    

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
        if (!(object instanceof Material)) {
            return false;
        }
        Material other = (Material) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.materiam.entities.Material[ id=" + id + " ]";
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
     * @return the thickness
     */
    public Double getThickness() {
        return thickness;
    }

    /**
     * @param thickness the thickness to set
     */
    public void setThickness(Double thickness) {
        this.thickness = thickness;
    }

    /**
     * @return the density
     */
    public Double getDensity() {
        return density;
    }

    /**
     * @param density the density to set
     */
    public void setDensity(Double density) {
        this.density = density;
    }

    /**
     * @return the pricePerKg
     */
    public Double getPricePerKg() {
        return pricePerKg;
    }

    /**
     * @param pricePerKg the pricePerKg to set
     */
    public void setPricePerKg(Double pricePerKg) {
        this.pricePerKg = pricePerKg;
    }

    /**
     * @return the cuttingSpeed
     */
    public Double getCuttingSpeed() {
        return cuttingSpeed;
    }

    /**
     * @param cuttingSpeed the cuttingSpeed to set
     */
    public void setCuttingSpeed(Double cuttingSpeed) {
        this.cuttingSpeed = cuttingSpeed;
    }

    /**
     * @return the process
     */
    public Process getProcess() {
        return process;
    }

    /**
     * @param process the process to set
     */
    public void setProcess(Process process) {
        this.process = process;
    }
    
}
