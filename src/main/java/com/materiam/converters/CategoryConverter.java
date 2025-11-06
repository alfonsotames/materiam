/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.converters;


import com.materiam.entities.Category;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.faces.component.UIComponent;
import jakarta.faces.context.FacesContext;
import jakarta.faces.convert.Converter;
import jakarta.faces.convert.FacesConverter;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author mufufu
 */
@Named
@ApplicationScoped
@FacesConverter(value="CategoryConverter", managed = true)
public class CategoryConverter implements Converter {

    @PersistenceContext(unitName = "materiam")
    private EntityManager em;
   

    @Override
    public Object getAsObject(FacesContext context, UIComponent component, String value) {

        try {
            Category cat = em.find(Category.class,Long.parseLong(value));
            return cat;
            
        } catch (NullPointerException | NumberFormatException npe) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error al convertir a Category ", npe);
            return null;
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error al convertir a Category ", e);
            return null;
        }
    }

    @Override
    public String getAsString(FacesContext context, UIComponent component, Object value) {

        if (value == null) {
            return "";
        }        
        try {
            Category cat = (Category)value;
            //System.out.println("Converter: getAsString: "+mt.getName()); 
            return cat.toString();
        } catch (NullPointerException | NumberFormatException npe) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error al convertir a Category ", npe);
            return null;
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error al converter a string", e);
            return null;
        }
    }
    
}
