/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.controllers;

import com.materiam.entities.CADFile;
import com.materiam.entities.Part;
import com.materiam.entities.Project;
import org.primefaces.PrimeFaces;
import org.primefaces.event.FileUploadEvent;
import org.primefaces.event.FilesUploadEvent;
import org.primefaces.model.file.UploadedFile;
import org.primefaces.model.file.UploadedFiles;
import org.primefaces.util.EscapeUtils;

import jakarta.enterprise.context.RequestScoped;
import jakarta.faces.application.FacesMessage;
import jakarta.faces.context.FacesContext;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonObject;
import jakarta.json.JsonReader;
import jakarta.json.JsonString;
import jakarta.json.JsonValue;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.StringReader;


import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;


import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Pattern;



/**
 *
 * @author mufufu
 */
@Named(value = "fileUploadController")
@RequestScoped
@Transactional
public class FileUploadController {
    
    
    @Inject
    private HttpServletRequest request;
        
    @PersistenceContext(unitName = "materiam")
    private EntityManager em;
    private String destination = "/home/mufufu/Downloads/materiam/data/projects/";

        

    public void upload(FileUploadEvent event) {
        FacesMessage msg = new FacesMessage("Success! ", event.getFile().getFileName() + " is uploaded.");
        FacesContext.getCurrentInstance().addMessage(null, msg);
        
        UploadedFile file = event.getFile();
        // Do what you want with the file
        try {
            copyFile(event.getFile().getFileName(), file.getInputStream());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    public void copyFile(String fileName, InputStream in) {
        fileName = sanitizeFilename(fileName);
        HttpSession session = request.getSession();
        Project activeProject = null;
        activeProject = (Project) session.getAttribute("activeProject");
        if (activeProject == null) {
            // Generate a new project
            activeProject = new Project();
            em.persist(activeProject);
            em.flush();
        }
        System.out.println("Created Project: "+activeProject.getId());
        session.setAttribute("activeProject", activeProject);
        
        CADFile f = new CADFile();
        f.setName(fileName);
        f.setProject(activeProject);
        em.persist(f);
        em.flush();
        

        destination = destination.concat(activeProject.getId()+"/"+f.getId()+"/");
        Path path = Paths.get(destination);
        try {
            
            Files.createDirectories(path);
            System.out.println("Directory created successfully at: " + path.toAbsolutePath());
                    
                    
            // write the inputStream to a FileOutputStream
            OutputStream out = new FileOutputStream(new File(destination + fileName));
            int read = 0;
            byte[] bytes = new byte[1024];
            while ((read = in.read(bytes)) != -1) {
                out.write(bytes, 0, read);
            }
            in.close();
            out.flush();
            out.close();
            System.out.println("New file uploaded: " + (destination + fileName));
            
            

            Runtime rt = Runtime.getRuntime();
            
            String command = String.format("asiSheetMetalExe %s %s/out.json -image %s/image.png -asm -imagesForParts -gltf -flat -expandCompounds -onlyCuttingLines -gltfWithColors -step -profile -weldings", (destination + fileName), destination, destination);
            Process pr = rt.exec(command);
            try {
                pr.waitFor();
            } catch (InterruptedException ex) {
                System.getLogger(FileUploadController.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
            }
            

            
            
        } catch (IOException e) {
            System.out.println(e.getMessage());
        }
        
        try (JsonReader jsonReader = Json.createReader(new StringReader(Files.readString(Paths.get(destination+"out.json"))))) {

            JsonObject json = jsonReader.readObject();
            System.out.println("JsonObject toString output:");
            System.out.println(json.toString());

            // The STEP file has an array of parts and each part has an array of bodies

            // Get the "parts" array
            JsonArray parts = json.getJsonArray("parts");

            // Iterate through each part object
            for (JsonObject p : parts.getValuesAs(JsonObject.class)) {
                
                JsonArray bodies = p.getJsonArray("bodies");
                
                for (JsonObject b : bodies.getValuesAs(JsonObject.class)) {
                    
                    String id = p.getString("id");
                    System.out.println("Part ID: " + id);
                    /*
                    Part part = new Part();
                    part.setNid(p.getString("id"));
                    part.setName(p.getString("name"));
                    */

                }

            }
            
        }   catch (IOException ex) {
                System.getLogger(FileUploadController.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
            }
        
    }
    
    
        private static final Pattern INVALID_FILENAME_CHARS = 
        Pattern.compile("[^a-zA-Z0-9\\.\\-_]"); // Allows alphanumeric, dot, hyphen, underscore

        public static String sanitizeFilename(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            return "default_filename"; // Or throw an IllegalArgumentException
        }
        
        // Remove leading/trailing whitespace
        String sanitized = filename.trim();

        // Replace invalid characters with an underscore
        sanitized = INVALID_FILENAME_CHARS.matcher(sanitized).replaceAll("_");

        // Prevent directory traversal attempts (e.g., removing ".." or "/" segments)
        sanitized = sanitized.replace("..", "_").replace("/", "_").replace("\\", "_");

        // Ensure the filename is not empty after sanitization
        if (sanitized.isEmpty()) {
            return "sanitized_empty_filename"; // Fallback if all characters were invalid
        }

        return sanitized;
    }
    
    
}
