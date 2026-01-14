package com.materiam.converters;

import com.materiam.entities.Product;
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
 * JSF Converter for Product entities.
 */
@Named
@ApplicationScoped
@FacesConverter(value = "ProductConverter", managed = true)
public class ProductConverter implements Converter<Object> {

    @PersistenceContext(unitName = "materiam")
    private EntityManager em;

    @Override
    public Object getAsObject(FacesContext context, UIComponent component, String value) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        try {
            return em.find(Product.class, Long.parseLong(value));
        } catch (NullPointerException | NumberFormatException npe) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error converting to Product", npe);
            return null;
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error converting to Product", e);
            return null;
        }
    }

    @Override
    public String getAsString(FacesContext context, UIComponent component, Object value) {
        if (value == null) {
            return "";
        }
        if (value instanceof String) {
            return (String) value;
        }
        try {
            Product product = (Product) value;
            return product.getId().toString();
        } catch (NullPointerException npe) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error converting Product to string", npe);
            return "";
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, "Error converting Product to string", e);
            return "";
        }
    }
}
