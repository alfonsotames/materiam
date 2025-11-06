/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.converters;


import com.materiam.entities.Property;
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
@FacesConverter(value="PropertyConverter", managed = true)
public class PropertyConverter implements Converter {
    @PersistenceContext(unitName = "materiam")
    private EntityManager em;
   

    @Override
    public Object getAsObject(FacesContext context, UIComponent component, String value) {

        try {
            Property prop = em.find(Property.class,Long.parseLong(value));
            //System.out.println("Converter regresa el objeto "+mt.getId()+" name: "+mt.getName());
            return prop;
            
        } catch (NullPointerException | NumberFormatException npe) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error al convertir a Property ", npe);
            return null;
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error al convertir a Property ", e);
            return null;
        }
    }

    @Override
    public String getAsString(FacesContext context, UIComponent component, Object value) {

        if (value == null) {
            return "";
        }        
        try {
            Property mt = (Property)value;
            return mt.toString();
        } catch (NullPointerException | NumberFormatException npe) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error al convertir a Property ", npe);
            return null;
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error al converter a string", e);
            return null;
        }
    }    
}
