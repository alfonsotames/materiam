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
 * Represents an instance of a Part or Assembly in 3D space with transformation.
 * The transformation is stored as a 4x4 matrix in row-major order:
 * [m00,m01,m02,m03, m10,m11,m12,m13, m20,m21,m22,m23, m30,m31,m32,m33]
 * Where m03,m13,m23 are translation (Tx,Ty,Tz) and the 3x3 upper-left is rotation/scale.
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

    @ManyToOne
    private Assembly assembly;

    // The persid from the assembly.json (e.g., "0-1-2")
    private String persid;

    // 4x4 transformation matrix in row-major order
    // Row 0: rotation/scale + translation X
    private double m00 = 1.0;
    private double m01 = 0.0;
    private double m02 = 0.0;
    private double m03 = 0.0; // Tx

    // Row 1: rotation/scale + translation Y
    private double m10 = 0.0;
    private double m11 = 1.0;
    private double m12 = 0.0;
    private double m13 = 0.0; // Ty

    // Row 2: rotation/scale + translation Z
    private double m20 = 0.0;
    private double m21 = 0.0;
    private double m22 = 1.0;
    private double m23 = 0.0; // Tz

    // Row 3: always [0, 0, 0, 1] for affine transforms
    private double m30 = 0.0;
    private double m31 = 0.0;
    private double m32 = 0.0;
    private double m33 = 1.0;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Assembly getAssembly() {
        return assembly;
    }

    public void setAssembly(Assembly assembly) {
        this.assembly = assembly;
    }

    public Part getPart() {
        return part;
    }

    public void setPart(Part part) {
        this.part = part;
    }

    public CADFile getCadfile() {
        return cadfile;
    }

    public void setCadfile(CADFile cadfile) {
        this.cadfile = cadfile;
    }

    public String getPersid() {
        return persid;
    }

    public void setPersid(String persid) {
        this.persid = persid;
    }

    /**
     * Set the transformation matrix from a 16-element array (row-major order).
     * @param transform Array of 16 doubles [m00,m01,m02,m03, m10,m11,m12,m13, m20,m21,m22,m23, m30,m31,m32,m33]
     */
    public void setTransformFromArray(double[] transform) {
        if (transform == null || transform.length != 16) {
            // Set identity matrix if invalid
            setIdentityTransform();
            return;
        }
        m00 = transform[0];  m01 = transform[1];  m02 = transform[2];  m03 = transform[3];
        m10 = transform[4];  m11 = transform[5];  m12 = transform[6];  m13 = transform[7];
        m20 = transform[8];  m21 = transform[9];  m22 = transform[10]; m23 = transform[11];
        m30 = transform[12]; m31 = transform[13]; m32 = transform[14]; m33 = transform[15];
    }

    /**
     * Get the transformation matrix as a 16-element array (row-major order).
     * @return Array of 16 doubles
     */
    public double[] getTransformAsArray() {
        return new double[] {
            m00, m01, m02, m03,
            m10, m11, m12, m13,
            m20, m21, m22, m23,
            m30, m31, m32, m33
        };
    }

    /**
     * Set the transformation to identity matrix.
     */
    public void setIdentityTransform() {
        m00 = 1.0; m01 = 0.0; m02 = 0.0; m03 = 0.0;
        m10 = 0.0; m11 = 1.0; m12 = 0.0; m13 = 0.0;
        m20 = 0.0; m21 = 0.0; m22 = 1.0; m23 = 0.0;
        m30 = 0.0; m31 = 0.0; m32 = 0.0; m33 = 1.0;
    }

    /**
     * Check if this instance has a non-identity transform.
     */
    public boolean hasTransform() {
        return m00 != 1.0 || m01 != 0.0 || m02 != 0.0 || m03 != 0.0 ||
               m10 != 0.0 || m11 != 1.0 || m12 != 0.0 || m13 != 0.0 ||
               m20 != 0.0 || m21 != 0.0 || m22 != 1.0 || m23 != 0.0;
    }

    // Individual matrix element getters
    public double getM00() { return m00; }
    public double getM01() { return m01; }
    public double getM02() { return m02; }
    public double getM03() { return m03; }
    public double getM10() { return m10; }
    public double getM11() { return m11; }
    public double getM12() { return m12; }
    public double getM13() { return m13; }
    public double getM20() { return m20; }
    public double getM21() { return m21; }
    public double getM22() { return m22; }
    public double getM23() { return m23; }
    public double getM30() { return m30; }
    public double getM31() { return m31; }
    public double getM32() { return m32; }
    public double getM33() { return m33; }

    // Individual matrix element setters
    public void setM00(double m00) { this.m00 = m00; }
    public void setM01(double m01) { this.m01 = m01; }
    public void setM02(double m02) { this.m02 = m02; }
    public void setM03(double m03) { this.m03 = m03; }
    public void setM10(double m10) { this.m10 = m10; }
    public void setM11(double m11) { this.m11 = m11; }
    public void setM12(double m12) { this.m12 = m12; }
    public void setM13(double m13) { this.m13 = m13; }
    public void setM20(double m20) { this.m20 = m20; }
    public void setM21(double m21) { this.m21 = m21; }
    public void setM22(double m22) { this.m22 = m22; }
    public void setM23(double m23) { this.m23 = m23; }
    public void setM30(double m30) { this.m30 = m30; }
    public void setM31(double m31) { this.m31 = m31; }
    public void setM32(double m32) { this.m32 = m32; }
    public void setM33(double m33) { this.m33 = m33; }

    // Convenience getters for translation
    public double getTranslationX() { return m03; }
    public double getTranslationY() { return m13; }
    public double getTranslationZ() { return m23; }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
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
        return "Instance[id=" + id + ", persid=" + persid + "]";
    }
}
