/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.controllers;

import com.materiam.entities.Assembly;
import com.materiam.entities.CADFile;
import com.materiam.entities.Category;
import com.materiam.entities.FabProcess;
import com.materiam.entities.Instance;
import com.materiam.entities.Material;
import com.materiam.entities.Part;
import com.materiam.entities.Product;
import com.materiam.entities.Project;
import com.materiam.entities.Property;
import com.materiam.entities.User;
import jakarta.annotation.PostConstruct;
import jakarta.ejb.Asynchronous;
import jakarta.enterprise.context.SessionScoped;
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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import org.primefaces.event.FileUploadEvent;
import org.primefaces.model.file.UploadedFile;

/**
 *
 * @author mufufu
 */

// TODO: ProjectController must have a list of active uploads 
// Each upload must send status messages starting with an identifying string- projectid:99|||cafdile:23|||Message

/* TODO: Crea una clase ManufacturingOrder donde incluyas las partes que van a la orden con sus cantidades y un total
       La base es QuotedParts!!! incluye shipping, shipping address, etc. Pon checkboxes prechecadas en las partes
       manufacturables. En las que no (tornillos) sin el check y si le dan check un "will quote in separate order".
*/

/* TODO: Pon un icono de ojito en la esquina derecha superior de la imagen de la parte para incluirla en el assembly
            y así ir haciendo pares para luego poner el selector de soldadura
*/


@Named(value = "projectController")
@SessionScoped
@Transactional
public class ProjectController implements Serializable {
    @Inject
    private HttpServletRequest request;
    
    @Inject
    UserController userController;
        
    @PersistenceContext(unitName = "materiam")
    private EntityManager em;
    
    private Project activeProject;
    
    private Map<String, Object> definitionsEntityMap;

    
    
    private String destination = "/home/mufufu/Downloads/materiam/data/projects/";
    //private String destination = "/Users/mufufu/Downloads/materiam/data/projects/";
        
    
    @PostConstruct
    public void init() {
        //activeProject = new Project();
    }
    
    public Property getPropertyByKey(Long productid, String key) {
        Property prop = null;
        
        try {
            prop = (Property)em.createQuery("select prop from Property prop, Product p, PropertyType pt "
                    + "where pt.key=:key and prop.propertyType=pt and prop.product.id=:productid")
                    .setParameter("key", key)
                    .setParameter("productid", productid)
                    .setMaxResults(1)
                    .getSingleResult();
        } catch (Exception e ) {
            
        }
        return prop;
        
    }    
    
    public List<Project> getProjects() {
        User u = em.find(User.class, userController.getUser().getId());
        return u.getProjects();
    }
    
    public void openProject(Project pr) {
        FacesContext facesContext = FacesContext.getCurrentInstance();
        ExternalContext externalContext = facesContext.getExternalContext();
        this.activeProject = pr;
        String path = request.getContextPath() + "/project.xhtml";
        try {
            externalContext.redirect(path);
        } catch (IOException ex) {
            System.getLogger(ProjectController.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
        }
    }
    
    public CADFile getFirstCADFileForProject(Project p) {
        

        
        CADFile cf = null;
        if (p==null)
            return cf;
        System.out.println("************* -------- getFirstCADFileForProject ----------- ***************"+p.getName());        
        try {
            cf=  (CADFile)em.createQuery("select cf from CADFile cf where cf.project.id=:projectid order by cf.id")
                .setParameter("projectid", p.getId()).setMaxResults(1).getSingleResult();
        } catch (Exception ex) {
            System.getLogger(ProjectController.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
        }
        return cf;
    }
    
    public void closeProject() {
        Project p = em.find(Project.class, activeProject.getId());
        em.remove(p);
        activeProject=null;
    }

    public void save() {
        
        if (activeProject != null) {
            System.out.println("************* -------- Saving name ----------- ***************"+activeProject.getName());
            Project p = em.find(Project.class, activeProject.getId());
            p.setName(activeProject.getName());
        }

        
    }
    
    public Set<Part> getParts(Long cfid) {
        //System.out.println("Retrieving parts...");
        
        CADFile cf = em.find(CADFile.class, cfid);
        
        for (Part p : cf.getParts()) {
            System.out.println("Part id: "+p.getId());
        }
        return cf.getParts();
    }
    
    /*
    public List<Instance> getInstances(Long cfid) {
        CADFile cf = em.find(CADFile.class, cfid);
        return cf.getInstances();
    }
    */
    
    public List<CADFile> getCADFiles() {
        List<CADFile> cfs = em.createQuery("select cf from CADFile cf where cf.project = :project")
                .setParameter("project", activeProject).getResultList();
        return cfs;
    }
    
    public List<QuotedPart> getQuotedParts(CADFile cadfile) {
        List<QuotedPart> qps = new ArrayList<>();
        List<Part> parts = em.createQuery("SELECT p FROM Part p, CADFile cf, Project pr  where pr=:project and cf.project=pr and p.cadfile=cf and cf=:cadfile")
                                                .setParameter("project", activeProject)
                                                .setParameter("cadfile", cadfile)
                                                .getResultList();
        for (Part p : parts) {
            System.out.println("Part id: "+p.getId());
            QuotedPart qp = new QuotedPart();
            qp.setPart(p);
            if (p.getShape().getKey().equals("SHEET_METAL_FLAT") || p.getShape().getKey().equals("SHEET_METAL_FOLDED")) {
                BigDecimal price = new BigDecimal(0.00);
                try {
                BigDecimal volumen;
                volumen = p.getFlatObbLength().divide(BigDecimal.valueOf(1000)).multiply(p.getFlatObbWidth().divide(BigDecimal.valueOf(1000)));
                volumen = volumen.multiply(p.getThickness().divide(BigDecimal.valueOf(1000)));
                System.out.println("VOLUMEN: "+volumen);
                
                price = p.getVolume().divide(BigDecimal.valueOf(1000000000));
                System.out.println("Price 1: "+price);
                
                // get material from new product relationship
                
                Property density = (Property)em.createQuery("select den from Property den where den.product=:product and den.propertyType.key='DENSITY'")
                        .setParameter("product", p.getMaterial()).getSingleResult();
                
                price = price.multiply(density.getValue());
                System.out.println("Price 2: "+price);
                
                Property ppk = (Property)em.createQuery("select ppk from Property ppk where ppk.product=:product and ppk.propertyType.key='PRICEPERKG'")
                        .setParameter("product", p.getMaterial()).getSingleResult();
                
                price = price.multiply(ppk.getValue());



                /* TODO: Determine the cutting process by thickness and max min for each material / process.
                         Right now it is hard set at Laser cutting.
                */
                FabProcess fp = (FabProcess)em.find(FabProcess.class, 1L);

                // get process time
                System.out.println("p.getFlatTotalContourLength()"+p.getFlatTotalContourLength());
                
                // get cutting speed
                // TODO: integrate cutting speed
                /*
                CuttingSpeed cs = (CuttingSpeed)em.createQuery(
                        "select cs from CuttingSpeed cs where cs.material=:material and cs.fabProcess=:fabProcess")
                        .setParameter("material", p.getMaterial())
                        .setParameter("fabProcess", fp)
                        .getSingleResult();
                */
                BigDecimal cs = new BigDecimal(28.5);
                //System.out.println("Cutting speed: "+cs);
                BigDecimal pPrice =  p.getFlatTotalContourLength().divide(cs, 2, RoundingMode.HALF_UP);
                //System.out.println("Process Time in Seconds: "+pPrice);
                pPrice = pPrice.multiply((fp.getPriceph().divide(BigDecimal.valueOf(3600), 2, RoundingMode.HALF_UP)));

                //System.out.println("Process price: "+pPrice);
                price = price.add(pPrice);
                
                // Press break down curtain -> 10 segs
                FabProcess fppb = (FabProcess)em.find(FabProcess.class, 3L);
                BigDecimal ppb = (fppb.getPriceph()).divide(new BigDecimal(60),2, RoundingMode.HALF_UP);
                //System.out.println(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Price per minute of press breake: $ "+ppb);
                ppb = ppb.divide(new BigDecimal(6), 2, RoundingMode.HALF_UP);
                //System.out.println(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Price per bend: $ "+ppb);
                
                if (p.getShape().getKey().equals("SHEET_METAL_FOLDED")) {
                    price = price.add(ppb.multiply(new BigDecimal(qp.getPart().getBends())));
                }
                
                
                } catch (java.lang.NullPointerException ex) {
                    System.out.println("Error while calculating price!!!!");
                    price = BigDecimal.ZERO;
                }
                qp.setPrice(price);

                } else if (p.getShape().getKey().equals("TUBE_RECTANGULAR") ) {
                    
                    
                    
                Property density = (Property)em.createQuery("select den from Property den where "
                        + "den.product=:product and den.propertyType.key='DENSITY'")
                        .setParameter("product", p.getMaterial()).getSingleResult();
                
                Property ppk = (Property)em.createQuery("select ppk from Property ppk where "
                        + "ppk.product=:product and ppk.propertyType.key='PRICEPERKG'")
                        .setParameter("product", p.getMaterial()).getSingleResult();                    
                    

                    BigDecimal price = new BigDecimal(0.00);
                    //System.out.println("Volume in mm3 of the tube: "+p.getVolume());
                    price = p.getVolume().divide(BigDecimal.valueOf(1000000000));
                    //System.out.println("Volume in m3: "+price);
                    price = price.multiply(density.getValue());
                    //System.out.println("Weight in Kg: "+price);
                    price = price.multiply(ppk.getValue());
                    qp.setPrice(price);
                } else {
                    qp.setPrice(new BigDecimal(0));
                }
            qps.add(qp);
        }        
        return qps;
    }
    
    public BigDecimal getTotal() {
        if (activeProject == null)
            return BigDecimal.ZERO;
        BigDecimal total = new BigDecimal(0);
        for (CADFile cf : activeProject.getCadfiles()) {

            for (QuotedPart q : getQuotedParts(cf)) {

                    total = total.add(q.getPrice());

            }
        }
        
        return total;
    }
    
    /*
    
    
    We will to the following in this and auxiliary functions:
    
    
    1. Generate a new Project where the uploaded CAD file will be stored
    2. Generate the folders <project/cadfile> and store the cadfile there
    3. Run stepguru on the CAD file to generate PNG, GLB and the assembly.json file
    4. 
    5. Run amatix on the folded sheet metal parts.
    
    */
    
    
    @Asynchronous
    public void uploadCadFile(FileUploadEvent event) {
        FacesContext facesContext = FacesContext.getCurrentInstance();
        ExternalContext externalContext = facesContext.getExternalContext();
        
        userController.sendUpdate("Uploading CAD file...");
        System.out.println("* - * - * * - * - * * - * - *  Uploading File * - * - *  * - * - * * - * - * ");
        FacesMessage msg = new FacesMessage("Success! ", event.getFile().getFileName() + " is uploaded.");
        FacesContext.getCurrentInstance().addMessage(null, msg);
        
        UploadedFile file = event.getFile();
        
        // Do what you want with the file
        userController.sendUpdate("Importing file...");
        String fileName = sanitizeFilename(event.getFile().getFileName());
        
        HttpSession session = request.getSession();

        fileName = sanitizeFilename(fileName);


        if (activeProject == null) {
            System.out.println("⚠️ ⚠️ ⚠️ ActiveProject is null when copying file... ⚠️ ⚠️ ⚠️");
            // Generate a new project
            activeProject = new Project();
            activeProject.setCadfiles(new ArrayList<CADFile>());
            activeProject.setName(fileName);
            activeProject.setPostedDate(new Date());
            UUID uuid = UUID.randomUUID();
            getActiveProject().setUuid(uuid.toString());
            em.persist(getActiveProject());

        } else {
            System.out.println("⚠️ ⚠️ ⚠️ ActiveProject is NOT null when copying file... ⚠️ ⚠️ ⚠");
            activeProject = em.find(Project.class, getActiveProject().getId());
        }

        if (userController.getUser() != null) {
            User u = em.find(User.class, userController.getUser().getId());
            if (!u.getProjects().contains(activeProject)) {
                u.getProjects().add(activeProject);
            }
            
        }
        
        
        CADFile f = new CADFile();
        f.setName(fileName);
        f.setProject(getActiveProject());
        UUID fuuid = UUID.randomUUID();
        f.setUuid(fuuid.toString());
        f.setParts(new HashSet<Part>());
        //f.setInstances(new ArrayList<Instance>());
        activeProject.getCadfiles().add(f);

        String filedest = destination.concat(getActiveProject().getUuid()+"/"+f.getUuid()+"/");
        Path path = Paths.get(filedest);
        try {
            InputStream in = file.getInputStream();
            
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
            

        } catch (IOException e) {
            System.out.println(e.getMessage());
        }        
        
        String command; // for holding command line instructions
        try {
            Runtime rt = Runtime.getRuntime();
            command = String.format("/usr/local/bin/stepguru %s --out %s -i",(filedest + fileName), filedest);
            System.out.println("* = - = * = - = Executing STEPGuru * = - = * = - = *");
            Process pr = rt.exec(command);
            BufferedReader reader = new BufferedReader(new InputStreamReader(pr.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(request.getSession().getId()+ " : " +line);
                if (line.startsWith("******") || line.contains("info:")) {
                    userController.sendUpdate(line);
                }
            }
            pr.waitFor();
        } catch (InterruptedException ex) {
                System.getLogger(ProjectController.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
        } catch (IOException ex) {
            System.getLogger(ProjectController.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
        } 

        
        // Parse assembly.json
        try (JsonReader jsonReader = Json.createReader(new StringReader(Files.readString(Paths.get(filedest+"assembly.json"))))) {

            JsonObject json = jsonReader.readObject();
            JsonArray definitions = json.getJsonArray("definitions");

            // Initialize the definitions map (in-memory only)
            Map<String, Object> definitionsEntityMap = new HashMap<>();

            System.out.println("=== Parsing Definitions (in memory) ===");

            // STEP 1: Create entities in memory - NO PERSIST YET
            for (JsonObject d : definitions.getValuesAs(JsonObject.class)) {
                String persid    = d.getString("id");
                String name      = d.getString("name");
                String shapeType = d.getString("shapeType");

                if (shapeType.equals("COMPOUND")) {
                    System.out.println("Creating assembly in memory: " + name);
                    Assembly assembly = new Assembly();
                    assembly.setPersid(persid);
                    assembly.setName(name);
                    assembly.setAssemblies(new ArrayList<>());
                    assembly.setParts(new ArrayList<>());
                    definitionsEntityMap.put(persid, assembly);
                }

                if (shapeType.equals("SOLID")) {
                    System.out.println("Creating part in memory: " + name);
                    Part p = new Part();
                    p.setPersid(persid);
                    p.setName(name);
                    p.setCadfile(f);
                    
                    String partType = d.getString("partType");
                    System.out.println("Found partType: "+partType);
                    if (partType.equals("TUBE_RECTANGULAR_BENT")) {
                        p.setShape(em.find(Category.class, 6L));
                        p.setSectionWidth(d.getJsonNumber("width").bigDecimalValue());
                        p.setSectionHeight(d.getJsonNumber("height").bigDecimalValue());
                        p.setPartLength(d.getJsonNumber("length").bigDecimalValue());
                        p.setThickness(d.getJsonNumber("thickness").bigDecimalValue());
                        p.setTotalArea(d.getJsonNumber("surfaceArea").bigDecimalValue());
                        p.setVolume(d.getJsonNumber("volume").bigDecimalValue());
                    }
                    if (partType.equals("TUBE_RECTANGULAR")) {
                        p.setShape(em.find(Category.class, 4L));
                        p.setSectionWidth(d.getJsonNumber("width").bigDecimalValue());
                        p.setSectionHeight(d.getJsonNumber("height").bigDecimalValue());
                        p.setPartLength(d.getJsonNumber("length").bigDecimalValue());
                        p.setThickness(d.getJsonNumber("thickness").bigDecimalValue());
                        p.setTotalArea(d.getJsonNumber("surfaceArea").bigDecimalValue());
                        p.setVolume(d.getJsonNumber("volume").bigDecimalValue());
                    }
                    if (partType.equals("TUBE_ROUND_BENT")) {
                        p.setShape(em.find(Category.class, 7L));
                        p.setDiameter(d.getJsonNumber("diameter").bigDecimalValue());
                        p.setPartLength(d.getJsonNumber("length").bigDecimalValue());
                        p.setThickness(d.getJsonNumber("thickness").bigDecimalValue());
                        p.setTotalArea(d.getJsonNumber("surfaceArea").bigDecimalValue());
                        p.setVolume(d.getJsonNumber("volume").bigDecimalValue());
                    }                   
                    if (partType.equals("TUBE_ROUND")) {
                        p.setShape(em.find(Category.class, 5L));
                        p.setDiameter(d.getJsonNumber("diameter").bigDecimalValue());
                        p.setPartLength(d.getJsonNumber("length").bigDecimalValue());
                        p.setThickness(d.getJsonNumber("thickness").bigDecimalValue());
                        p.setTotalArea(d.getJsonNumber("surfaceArea").bigDecimalValue());
                        p.setVolume(d.getJsonNumber("volume").bigDecimalValue());                        
                    }
                    if (partType.equals("SHEET_METAL_FLAT")) {
                        p.setShape(em.find(Category.class, 2L));
                        p.setThickness(d.getJsonNumber("thickness").bigDecimalValue());
                        p.setFlatTotalContourLength(d.getJsonNumber("cutLength").bigDecimalValue());
                        p.setTotalArea(d.getJsonNumber("surfaceArea").bigDecimalValue());
                        p.setVolume(d.getJsonNumber("volume").bigDecimalValue());
                        p.setFlatObbWidth(d.getJsonNumber("flatPatternWidth").bigDecimalValue());
                        p.setFlatObbLength(d.getJsonNumber("flatPatternLength").bigDecimalValue());
                    }
                    if (partType.equals("SHEET_METAL_FOLDED")) {
                        p.setShape(em.find(Category.class, 3L));
                        p.setThickness(d.getJsonNumber("thickness").bigDecimalValue());
                        p.setFlatTotalContourLength(d.getJsonNumber("cutLength").bigDecimalValue());
                        p.setTotalArea(d.getJsonNumber("surfaceArea").bigDecimalValue());
                        p.setVolume(d.getJsonNumber("volume").bigDecimalValue());
                        p.setBends(d.getJsonNumber("numBends").longValue());
                        p.setFlatObbWidth(d.getJsonNumber("flatPatternWidth").bigDecimalValue());
                        p.setFlatObbLength(d.getJsonNumber("flatPatternLength").bigDecimalValue());                        
                    }
                    if (partType.equals("UNKNOWN")) {
                        p.setShape(em.find(Category.class, 1L));
                    }                    
                    // check 
                    definitionsEntityMap.put(persid, p);
                }
            }

            // STEP 2: Traverse and build relationships
            System.out.println("\n=== Building Assembly Hierarchy ===");
            JsonObject root = json.getJsonObject("root");
            Assembly rootAssembly = traverseInstance(root, definitionsEntityMap, f);

            // STEP 3: Persist everything via cascade
            System.out.println("\n=== Persisting to Database ===");
            f.setRoot(rootAssembly);
            em.persist(f);  // Cascades to parts via CADFile
            em.persist(rootAssembly);  // Cascades to child assemblies and their parts

            System.out.println("Successfully persisted CADFile and assembly tree");

        } catch (IOException ex) {         
            System.getLogger(ProjectController.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
        }
        



        // TODO: Do not redirect if it is the same page!!!
        try {
            externalContext.redirect("project.xhtml"); 
        } catch (IOException e) {
            // Handle the IOException
            e.printStackTrace();
        }        
    }


    
    
    private Assembly traverseInstance(JsonObject instance, 
                                       Map<String, Object> definitionsEntityMap,
                                       CADFile cadFile) {
        if (instance == null) {
            return null;
        }

        String instanceId = instance.getString("id");
        String definitionId = instance.getString("definitionId");
        Object entity = definitionsEntityMap.get(definitionId);

        if (entity == null) {
            System.out.println("Warning: No entity found for definitionId: " + definitionId);
            return null;
        }

        JsonArray children = instance.getJsonArray("children");
        boolean hasChildren = (children != null && !children.isEmpty());

        if (entity instanceof Assembly) {
            Assembly assembly = (Assembly) entity;

            if (hasChildren) {
                for (int i = 0; i < children.size(); i++) {
                    JsonObject childInstance = children.getJsonObject(i);
                    String childDefId = childInstance.getString("definitionId");
                    Object childEntity = definitionsEntityMap.get(childDefId);

                    if (childEntity instanceof Assembly) {
                        Assembly childAssembly = traverseInstance(childInstance, definitionsEntityMap, cadFile);
                        if (childAssembly != null) {
                            childAssembly.setParent(assembly);  // Set parent reference
                            assembly.getAssemblies().add(childAssembly);
                        }
                    } else if (childEntity instanceof Part) {
                        Part childPart = (Part) childEntity;
                        assembly.getParts().add(childPart);
                        cadFile.getParts().add(childPart);  // Also add to CADFile's flat list
                    }
                }
            }

            System.out.println("Built assembly: " + assembly.getName() + 
                              " [" + assembly.getAssemblies().size() + " sub-assemblies, " + 
                              assembly.getParts().size() + " parts]");

            return assembly;
        }

        return null;
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

        
        
        
        
        
    
    public Material getMaterialByThickness(BigDecimal thickness) {
        return (Material)em.createQuery("select m from Material m order by ABS(m.thickness - :thickness").setParameter("thickness", thickness).getSingleResult();
    }
    
    public void deleteProject(Long pid) {
        
        

        try {
            User u = em.find(User.class, userController.getUser().getId());
            Project p = em.find(Project.class, pid);
            if (activeProject != null) {
                if (activeProject.getId() == p.getId()) {
                    activeProject = null;
                }
            }
            u.getProjects().remove(p);
            em.remove(p);
            
        } catch (Exception e) {
            System.out.println("Exception "+e.getMessage());
            FacesMessage msg = new FacesMessage(FacesMessage.SEVERITY_INFO,"Error", "An error occured while attempting to delete project");
            FacesContext.getCurrentInstance().addMessage(null, msg);             
        }


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
