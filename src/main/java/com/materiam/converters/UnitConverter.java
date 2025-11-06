/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.converters;

import com.materiam.entities.Unit;
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
@FacesConverter(value="UnitConverter", managed = true)
public class UnitConverter implements Converter {
    
    @PersistenceContext(unitName = "materiam")
    private EntityManager em;
    
    @Override
    public Object getAsObject(FacesContext fc, UIComponent uic, String value) {
        
        try {
            Unit u = em.find(Unit.class,Long.parseLong(value));
            //System.out.println("Converter regresa el objeto "+mt.getId()+" name: "+mt.getName());
            return u;
            
        } catch (NullPointerException | NumberFormatException npe) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error al convertir a Unit ", npe);
            return null;
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error al convertir a Unit ", e);
            return null;
        }        
        
    }

    @Override
    public String getAsString(FacesContext fc, UIComponent uic, Object t) {
        
        if (t == null) {
            return "";
        }        
        try {
            Unit u = (Unit)t;
            //System.out.println("Converter: getAsString: "+mt.getName()); 
            return u.toString();
        } catch (NullPointerException | NumberFormatException npe) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error al convertir a Unit ", npe);
            return null;
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error al converter a string", e);
            return null;
        }        
        
    }
    
}
