/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.converters;

import com.materiam.entities.MaterialFormat;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.logging.Level;
import java.util.logging.Logger;
import jakarta.faces.component.UIComponent;
import jakarta.faces.context.FacesContext;
import jakarta.faces.convert.Converter;
import jakarta.faces.convert.FacesConverter;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;


/**
 *
 * @author mufufu
 */
@Named
@ApplicationScoped
@FacesConverter(value="MaterialFormatConverter", managed = true)
public class MaterialFormatConverter implements Converter {
    
    @PersistenceContext(unitName = "materiam")
    private EntityManager em;


    @Override
    public Object getAsObject(FacesContext context, UIComponent component, String value) {

        try {
            MaterialFormat mf = em.find(MaterialFormat.class,Long.parseLong(value));
            //System.out.println("Converter regresa el objeto "+mf.getId()+" name: "+mf.getName());
            return mf;
            
        } catch (NullPointerException | NumberFormatException npe) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error al convertir a MaterialFormat ", npe);
            return null;
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error al convertir a MaterialFormat ", e);
            return null;
        }
    }

    @Override
    public String getAsString(FacesContext context, UIComponent component, Object value) {
        
        if (value == null) {
            return "";
        }
        try {
            MaterialFormat mf = (MaterialFormat)value;
            //System.out.println("Converter: getAsString: "+mf.getName()); 
            return mf.toString();
        } catch (NullPointerException | NumberFormatException npe) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error al convertir a MaterialFormat ", npe);
            return null;
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error al converter a string", e);
            return null;
        }
    }

    
}
