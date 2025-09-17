/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.controllers;

import com.materiam.entities.CADFile;
import com.materiam.entities.Instance;
import com.materiam.entities.Material;
import com.materiam.entities.Part;
import com.materiam.entities.PartType;
import com.materiam.entities.Project;
import events.EventQualifier;
import events.ImportUpdate;
import org.primefaces.event.FileUploadEvent;
import org.primefaces.model.file.UploadedFile;

import jakarta.enterprise.context.RequestScoped;
import jakarta.enterprise.event.Event;
import jakarta.faces.application.FacesMessage;
import jakarta.faces.context.ExternalContext;
import jakarta.faces.context.FacesContext;
import jakarta.faces.view.ViewScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.json.Json;
import jakarta.json.JsonArray;
import jakarta.json.JsonNumber;
import jakarta.json.JsonObject;
import jakarta.json.JsonReader;
import jakarta.json.JsonString;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.StringReader;


import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;
import java.io.Serializable;


/**
 *
 * @author mufufu
 */
@Named(value = "fileUploadController")
@ViewScoped
@Transactional
public class FileUploadController implements Serializable {
    
    
    @Inject
    private HttpServletRequest request;

    @Inject
    @EventQualifier
    Event<ImportUpdate> importUpdate;    
        
    @PersistenceContext(unitName = "materiam")
    private EntityManager em;
    private String destination = "/home/mufufu/Downloads/materiam/data/projects/";
    //private String destination = "/Users/mufufu/Downloads/materiam/data/projects/";

    private String wsid;
    
    public void submitwsid() {
        System.out.println(">>>>>>>>>>>>>>>>>>> Submitwsid inkoked: "+wsid);
    }

    public void upload(FileUploadEvent event) {
        System.out.println("* - * - * * - * - * * - * - *  FileUpload Invoked with wsid: "+wsid+" * - * - *  * - * - * * - * - * ");
        FacesMessage msg = new FacesMessage("Success! ", event.getFile().getFileName() + " is uploaded.");
        FacesContext.getCurrentInstance().addMessage(null, msg);
        
        UploadedFile file = event.getFile();
        // Do what you want with the file
        importUpdate.fire(new ImportUpdate("Importing file...",wsid));
        
        try {
            copyFile(event.getFile().getFileName(), file.getInputStream());
        } catch (IOException e) {
            e.printStackTrace();
        }
        FacesContext facesContext = FacesContext.getCurrentInstance();
        ExternalContext externalContext = facesContext.getExternalContext();

        
        try {
            externalContext.redirect("project.xhtml"); 
        } catch (IOException e) {
            // Handle the IOException
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
            activeProject.setName("New Project");
            activeProject.setPostedDate(new Date());
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
                BufferedReader reader = new BufferedReader(new InputStreamReader(pr.getInputStream()));
                String line;
                System.out.println("Process Output:");
                while ((line = reader.readLine()) != null) {
                    System.out.println(line);
                    importUpdate.fire(new ImportUpdate(line,wsid));
                }
                pr.waitFor();
            } catch (InterruptedException ex) {
                System.getLogger(FileUploadController.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
            }
            
            command = String.format("mogrify %s*.png -transparent white %s*.png",destination, destination);
            System.out.println("Executing mogrify: "+command);
            pr = rt.exec(command);
            try {
                BufferedReader reader = new BufferedReader(new InputStreamReader(pr.getInputStream()));
                String line;
                System.out.println("Process Output:");
                while ((line = reader.readLine()) != null) {
                    System.out.println(line);
                    importUpdate.fire(new ImportUpdate(line,wsid));
                }
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
            Map<String, Part> partmap = new HashMap<String, Part>();
            
            for (JsonObject p : parts.getValuesAs(JsonObject.class)) {
                
                JsonArray bodies = p.getJsonArray("bodies");
                
                for (JsonObject b : bodies.getValuesAs(JsonObject.class)) {
                    
                    String id = p.getString("id");
                    System.out.println("Part XDEID: " + id+ " Type: "+b.getString("type"));                    
                    Part part = new Part();
                    part.setCadfile(f);
                    part.setPersid(p.getString("id"));
                    part.setTimesRepeated(p.getJsonNumber("numOccurrences").longValue());
                    part.setName(p.getString("name"));
                    String type = b.getString("type");
                    part.setDimX(b.getJsonNumber("bboxDx").bigDecimalValue());
                    part.setDimY(b.getJsonNumber("bboxDy").bigDecimalValue());
                    part.setDimZ(b.getJsonNumber("bboxDz").bigDecimalValue());

                    
                    PartType pt = (PartType)em.createQuery("select pt from PartType pt where pt.type=:type").setParameter("type", type).getSingleResult();
                    part.setPartType(pt);
                    // TODO: Define routing and BOM data structures
                    /*
                    If it indeed is a Sheet Metal part, then we can define the manufacturing process.
                    This will help in our manufacturing application. We need to define basic routing
                    (1. laser cut, 2. bending) then the client defines material (BOM) and finishes
                    (additional routing stops).
                    */
                    if (type.equals("SHEET_METAL_FOLDED") || type.equals("SHEET_METAL_FLAT")) {
                        part.setFlatObbWidth(b.getJsonNumber("flatAabbWidth").bigDecimalValue());
                        part.setFlatObbLength(b.getJsonNumber("flatAabbLength").bigDecimalValue());
                        part.setThickness(b.getJsonNumber("thickness").bigDecimalValue());
                        part.setFlatTotalContourLength(b.getJsonNumber("flatTotalContourLength").bigDecimalValue());
                        // Assign Material id:1 as default
                        Material m = em.find(Material.class, 1L);
                        part.setMaterial(m);
                    }
                    em.persist(part);
                    partmap.put(p.getString("id"), part);                    
                }
            }
            em.flush();
            
            // Now obtain the instances, for each instance check the prototype
            
            JsonObject sceneTree = json.getJsonObject("sceneTree");
            JsonArray instances = sceneTree.getJsonArray("instances");
            JsonObject prototypes = sceneTree.getJsonObject("prototypes");
            JsonArray protoParts = prototypes.getJsonArray("parts");
            Map<JsonNumber,JsonString> pps = new HashMap<JsonNumber,JsonString>();
            for (JsonObject p : protoParts.getValuesAs(JsonObject.class)) {
                pps.put(p.getJsonNumber("id"), p.getJsonString("persistentId"));
            }
            
            System.out.println("pps contains:");
            for (Map.Entry<JsonNumber, JsonString> entry : pps.entrySet()) {
                System.out.println("Protopart: "+entry.getKey()+" : "+entry.getValue());
            }
            

            System.out.println("The Part Map has: ");
            for (Map.Entry<String,Part> entry : partmap.entrySet()) {
                System.out.println("Part:"+entry.getValue().getPersid()+" Part ID: "+entry.getValue().getId());
            }
                    
            for (JsonObject inst : instances.getValuesAs(JsonObject.class)) {
                System.out.println("Instance Prototype: "+inst.getJsonNumber("prototype"));
                JsonArray rotation = inst.getJsonArray("rotation");
                JsonArray translation = inst.getJsonArray("translation");
                
                Instance instance = new Instance();
                JsonString persid = pps.get(inst.getJsonNumber("prototype"));

                if (persid != null) {
                    System.out.println("Finding persid: "+persid+" inside the part map");

                    
                    Part part = partmap.get(persid.getString());
                    System.out.println("Found part "+part.getPersid());
                    System.out.println("The part found has id: "+part.getId());
                    instance.setPart(part);

                    instance.setRotx(rotation.getJsonNumber(0).bigDecimalValue());
                    instance.setTransx(translation.getJsonNumber(0).bigDecimalValue());
                    instance.setCadfile(f);

                    em.persist(instance);
                    em.flush();
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

    /**
     * @return the wsid
     */
    public String getWsid() {
        return wsid;
    }

    /**
     * @param wsid the wsid to set
     */
    public void setWsid(String wsid) {
        this.wsid = wsid;
    }


    
    
}
