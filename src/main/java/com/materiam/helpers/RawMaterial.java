/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.helpers;

import com.materiam.entities.Category;
import com.materiam.entities.Product;
import com.materiam.entities.Property;
import java.math.BigDecimal;

/**
 *
 * @author mufufu
 */
public class RawMaterial {
    
    private Product product;
    private Category shape;
    private Category alloy;
    private Property width;
    private Property length;
    private Property height;
    private Property thickness;
    private Property diameter;
    private Property density;
    private Property priceperkg;
    
    
    /**
     * @return the product
     */
    public Product getProduct() {
        return product;
    }

    /**
     * @param product the product to set
     */
    public void setProduct(Product product) {
        this.product = product;
    }


    /**
     * @return the alloy
     */
    public Category getAlloy() {
        return alloy;
    }

    /**
     * @param alloy the alloy to set
     */
    public void setAlloy(Category alloy) {
        this.alloy = alloy;
    }

    /**
     * @return the width
     */
    public Property getWidth() {
        return width;
    }

    /**
     * @param width the width to set
     */
    public void setWidth(Property width) {
        this.width = width;
    }

    /**
     * @return the length
     */
    public Property getLength() {
        return length;
    }

    /**
     * @param length the length to set
     */
    public void setLength(Property length) {
        this.length = length;
    }

    /**
     * @return the height
     */
    public Property getHeight() {
        return height;
    }

    /**
     * @param height the height to set
     */
    public void setHeight(Property height) {
        this.height = height;
    }

    /**
     * @return the thickness
     */
    public Property getThickness() {
        return thickness;
    }

    /**
     * @param thickness the thickness to set
     */
    public void setThickness(Property thickness) {
        this.thickness = thickness;
    }

    /**
     * @return the diameter
     */
    public Property getDiameter() {
        return diameter;
    }

    /**
     * @param diameter the diameter to set
     */
    public void setDiameter(Property diameter) {
        this.diameter = diameter;
    }

    /**
     * @return the density
     */
    public Property getDensity() {
        return density;
    }

    /**
     * @param density the density to set
     */
    public void setDensity(Property density) {
        this.density = density;
    }

    /**
     * @return the priceperkg
     */
    public Property getPriceperkg() {
        return priceperkg;
    }

    /**
     * @param priceperkg the priceperkg to set
     */
    public void setPriceperkg(Property priceperkg) {
        this.priceperkg = priceperkg;
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
    

    
    
}
