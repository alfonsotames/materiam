/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.controllers;

import com.materiam.entities.CADFile;
import com.materiam.entities.FabProcess;
import com.materiam.entities.Instance;
import com.materiam.entities.Material;
import com.materiam.entities.Part;
import com.materiam.entities.PartType;
import com.materiam.entities.Project;
import events.EventQualifier;
import events.ImportUpdate;
import jakarta.enterprise.context.SessionScoped;
import jakarta.enterprise.event.Event;
import jakarta.faces.application.FacesMessage;
import jakarta.faces.context.ExternalContext;
import jakarta.faces.context.FacesContext;
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
import jakarta.persistence.Query;
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
import java.io.Serializable;
import java.io.StringReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.primefaces.event.FileUploadEvent;
import org.primefaces.model.file.UploadedFile;

/**
 *
 * @author mufufu
 */

// TODO: ProjectController must have a list of active uploads 
// Each upload must send status messages starting with an identifying string- projectid:99|||cafdile:23|||Message

@Named(value = "projectcontroller")
@SessionScoped
@Transactional
public class ProjectController implements Serializable {
    @Inject
    private HttpServletRequest request;
        
    @PersistenceContext(unitName = "materiam")
    private EntityManager em;
    
    private Project activeProject;
    
    
    
    private String destination = "/home/mufufu/Downloads/materiam/data/projects/";
    //private String destination = "/Users/mufufu/Downloads/materiam/data/projects/";
        
        
    @Inject
    @EventQualifier
    Event<ImportUpdate> importUpdate;    
    
    /**
     * wsid is the websocket id, it changes every time a user loads or refreshes a page
     */    
    private String wsid;

    /**
     * The wsid is already assigned by the form submission
     */       
    public void submitwsid() {
        System.out.println(">>>>>>>>>>>>>>>>>>> ✅  Submitwsid inkoked: "+wsid);
    }
    
    
    
    public void save() {
        System.out.println("************* -------- Persistiendo el activeproject... ----------- ***************"+activeProject.getName());
        em.merge(activeProject);
    }
    
    public List<Part> getParts() {
        System.out.println("Retrieving parts...");
        List<Part> parts = em.createQuery("SELECT p FROM Part p, CADFile cf, Project pr  where pr=:project and cf.project=pr and p.cadfile=cf")
                                                .setParameter("project", activeProject).getResultList();
        for (Part p : parts) {
            System.out.println("Part id: "+p.getId());
        }
        return parts;
    }
    
    public List<QuotedPart> getQuotedParts() {
        List<QuotedPart> qps = new ArrayList<>();
        List<Part> parts = em.createQuery("SELECT p FROM Part p, CADFile cf, Project pr  where pr=:project and cf.project=pr and p.cadfile=cf")
                                                .setParameter("project", activeProject).getResultList();
        for (Part p : parts) {
            System.out.println("Part id: "+p.getId());
            QuotedPart qp = new QuotedPart();
            qp.setPart(p);
            if (p.getPartType().getType().equals("SHEET_METAL_FLAT") || p.getPartType().getType().equals("SHEET_METAL_FOLDED")) {
                BigDecimal price = new BigDecimal(0.00);

                BigDecimal volumen;
                volumen = p.getFlatObbLength().divide(BigDecimal.valueOf(1000)).multiply(p.getFlatObbWidth().divide(BigDecimal.valueOf(1000)));
                volumen = volumen.multiply(p.getThickness().divide(BigDecimal.valueOf(1000)));
                System.out.println("VOLUMEN: "+volumen);
                
                price = p.getVolume().divide(BigDecimal.valueOf(1000000000));
                System.out.println("Price 1: "+price);
                price = price.multiply(p.getMaterial().getDensity());
                System.out.println("Price 2: "+price);
                price = price.multiply(p.getMaterial().getPricePerKg());



                // TODO: Determine the cutting process by thickness and max min for each material / process
                FabProcess fp = (FabProcess)em.find(FabProcess.class, 1L);

                // get process time
                System.out.println("p.getFlatTotalContourLength()"+p.getFlatTotalContourLength());
                System.out.println("p.getMaterial().getLaserCuttingSpeed()"+p.getMaterial().getLaserCuttingSpeed());
                BigDecimal pPrice =  p.getFlatTotalContourLength().divide(p.getMaterial().getLaserCuttingSpeed(), 2, RoundingMode.HALF_UP);
                System.out.println("Process Time in Seconds: "+pPrice);
                pPrice = pPrice.multiply((fp.getPriceph().divide(BigDecimal.valueOf(3600), 2, RoundingMode.HALF_UP)));

                System.out.println("Process price: "+pPrice);
                price = price.add(pPrice);
                qp.setPrice(price);

                } else if (p.getPartType().getType().equals("TUBE_RECTANGULAR") ) {
                    BigDecimal price = new BigDecimal(0.00);
                    System.out.println("Volume in mm3 of the tube: "+p.getVolume());
                    price = p.getVolume().divide(BigDecimal.valueOf(1000000000));
                    System.out.println("Volume in m3: "+price);
                    price = price.multiply(p.getMaterial().getDensity());
                    System.out.println("Weight in Kg: "+price);
                    price = price.multiply(p.getMaterial().getPricePerKg());
                    qp.setPrice(price);
                } else {
                    qp.setPrice(new BigDecimal(0));
                }
            qps.add(qp);
        }        
        return qps;
    }
    

    // TODO: Make this method Asynchronous
    // Inform the user when the upload is complete so he can close the window
    // keep sending status messages
    
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

        // TODO: Do not redirect if it is the same page!!!
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
        

        if (getActiveProject() == null) {
            // Generate a new project
            setActiveProject(new Project());
            getActiveProject().setName("New Project");
            getActiveProject().setPostedDate(new Date());
            em.persist(getActiveProject());
            em.flush();
        }
        System.out.println("Active Project: "+getActiveProject().getId());

        
        CADFile f = new CADFile();
        f.setName(fileName);
        f.setProject(getActiveProject());
        em.persist(f);
        em.flush();
        

        String filedest = destination.concat(getActiveProject().getId()+"/"+f.getId()+"/");
        Path path = Paths.get(filedest);
        try {
            
            Files.createDirectories(path);
            System.out.println("Directory created successfully at: " + path.toAbsolutePath());
                    
                    
            // write the inputStream to a FileOutputStream
            OutputStream out = new FileOutputStream(new File(filedest + fileName));
            int read = 0;
            byte[] bytes = new byte[1024];
            while ((read = in.read(bytes)) != -1) {
                out.write(bytes, 0, read);
            }
            in.close();
            out.flush();
            out.close();
            System.out.println("New file uploaded: " + (filedest + fileName));
            
            

            Runtime rt = Runtime.getRuntime();
            
            //String command = String.format("asiSheetMetalExe %s %s/out.json -image %s/image.png -asm -imagesForParts -gltf -flat -expandCompounds -onlyCuttingLines -gltfWithColors -step -profile -weldings", (filedest + fileName), filedest, filedest);
            String command = String.format("asiSheetMetalExe %s %s/out.json -image %s/image.png -asm -imagesForParts -gltf -flat -expandCompounds -step -profile ", (filedest + fileName), filedest, filedest);

            Process pr = rt.exec(command);
            importUpdate.fire(new ImportUpdate("Reading STEP file...",wsid));
            try {
                BufferedReader reader = new BufferedReader(new InputStreamReader(pr.getInputStream()));
                String line;
                System.out.println("Process Output:");
                while ((line = reader.readLine()) != null) {
                    
                    System.out.println(line);
                    if (line.startsWith("******") || line.contains("info")) {
                        importUpdate.fire(new ImportUpdate(line,wsid));
                    }
                }
                pr.waitFor();
            } catch (InterruptedException ex) {
                System.getLogger(ProjectController.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
            }
            
            command = String.format("mogrify %s*.png -transparent white %s*.png",filedest, filedest);
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
                System.getLogger(ProjectController.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
            }
            
            
        } catch (IOException e) {
            System.out.println(e.getMessage());
        }
        
        try (JsonReader jsonReader = Json.createReader(new StringReader(Files.readString(Paths.get(filedest+"out.json"))))) {

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
                        part.setVolume(b.getJsonNumber("volume").bigDecimalValue());
                        part.setTotalArea(b.getJsonNumber("totalArea").bigDecimalValue());
                        // Assign Material id:1 as default
                        Material m = em.find(Material.class, 1L);
                        part.setMaterial(m);

                    } else if (type.equals("TUBE_RECTANGULAR")) {
                        part.setSectionWidth(b.getJsonNumber("sectionWidth").bigDecimalValue());
                        part.setSectionHeight(b.getJsonNumber("sectionHeight").bigDecimalValue());
                        part.setPartLength(b.getJsonNumber("partLength").bigDecimalValue());
                        part.setThickness(b.getJsonNumber("thickness").bigDecimalValue());
                        part.setVolume(b.getJsonNumber("volume").bigDecimalValue());
                        part.setTotalArea(b.getJsonNumber("totalArea").bigDecimalValue());
                        /*
                        Query q = em.createQuery("select m from Material m where m.width=:width and m.height=:height and m.thickness=:thickness")
                                                            .setParameter("width", b.getJsonNumber("sectionWidth").bigDecimalValue())
                                                            .setParameter("height", b.getJsonNumber("sectionHeight").bigDecimalValue())
                                                            .setParameter("thickness", b.getJsonNumber("partLength").bigDecimalValue());
                        */
                        System.out.println("Section Width: "+b.getJsonNumber("sectionWidth").bigDecimalValue().setScale(2, RoundingMode.HALF_UP));
                        
                        Query q = em.createQuery("select m from Material m where m.type='TUBE_RECTANGULAR' and m.width=:w and m.height=:h and m.thickness=:t")
                                .setParameter("w", b.getJsonNumber("sectionWidth").bigDecimalValue().setScale(2, RoundingMode.HALF_UP))
                                .setParameter("h", b.getJsonNumber("sectionHeight").bigDecimalValue().setScale(2, RoundingMode.HALF_UP))
                                .setParameter("t", b.getJsonNumber("thickness").bigDecimalValue().setScale(2, RoundingMode.HALF_UP));
                        
                        
                        System.out.println("Query: "+q.toString());
                        Material m = (Material)q.getSingleResult();
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
                System.getLogger(ProjectController.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
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

        
        
        
        
        
    
    public Material getMaterialByThickness(Double thickness) {
        return (Material)em.createQuery("select m from Material m where m.thickness=:thickness").setParameter("thickness", thickness).getSingleResult();
    }
    
    public void deleteProject() {
        
    }

    /**
     * @return the activeProject
     */
    public Project getActiveProject() {
        return activeProject;
    }

    /**
     * @param activeProject the activeProject to set
     */
    public void setActiveProject(Project activeProject) {
        this.activeProject = activeProject;
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
    
    
    
    public class QuotedPart {
        private Part part;
        private BigDecimal price;
        /**
         * @return the part
         */
        public Part getPart() {
            return part;
        }

        /**
         * @param part the part to set
         */
        public void setPart(Part part) {
            this.part = part;
        }

        /**
         * @return the price
         */
        public BigDecimal getPrice() {
            return price;
        }

        /**
         * @param price the price to set
         */
        public void setPrice(BigDecimal price) {
            this.price = price;
        }  
    }
    
}

