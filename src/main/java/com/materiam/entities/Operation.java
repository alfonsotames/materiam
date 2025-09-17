/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import java.io.Serializable;
import java.util.Set;

/**
 *
 * @author mufufu
 */
@Entity
public class Operation implements Serializable {

    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @OneToMany
    private Set<Part> parts;
    private FabProcess process;
    private Material material;
    private Station station;


    
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
     * @return the process
     */
    public FabProcess getProcess() {
        return process;
    }

    /**
     * @param process the process to set
     */
    public void setProcess(FabProcess process) {
        this.process = process;
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
     * @return the station
     */
    public Station getStation() {
        return station;
    }

    /**
     * @param station the station to set
     */
    public void setStation(Station station) {
        this.station = station;
    }
    private static final long serialVersionUID = 1L;
    

    
    
}
