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
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 *
 * @author mufufu
 */
@Entity
@Table(uniqueConstraints={
    @UniqueConstraint(columnNames = {"material_id", "fabprocess_id"})
}) 
public class CuttingSpeed implements Serializable {

    /**
     * @return the fabProcess
     */
    public FabProcess getFabProcess() {
        return fabProcess;
    }

    /**
     * @param fabProcess the fabProcess to set
     */
    public void setFabProcess(FabProcess fabProcess) {
        this.fabProcess = fabProcess;
    }

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    private Material material;
    private FabProcess fabProcess;
    @Column(precision = 6, scale = 2) // 28.5 mm/s       
    private BigDecimal speed;
 

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

        if (!(object instanceof CuttingSpeed)) {
            return false;
        }
        CuttingSpeed other = (CuttingSpeed) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.materiam.entities.CuttingSpeed[ id=" + id + " ]";
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
     * @return the speed in mm/seg
     */
    public BigDecimal getSpeed() {
        return speed;
    }

    /**
     * @param speed the speed to set
     */
    public void setSpeed(BigDecimal speed) {
        this.speed = speed;
    }


    
}
