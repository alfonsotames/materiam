/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.controllers;

import com.materiam.config.PathConfig;
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
import org.primefaces.model.DefaultTreeNode;
import org.primefaces.model.TreeNode;

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

    @Inject
    QuotingEngine quotingEngine;

    @PersistenceContext(unitName = "materiam")
    private EntityManager em;

    private Project activeProject;

    private Map<String, Object> definitionsEntityMap;

    // Cached assembly tree for quoting
    private TreeNode<TreeNodeData> cachedAssemblyTree;
    private Long cachedProjectId;
    private boolean treeQuoted;

    // BOM view toggle
    private boolean bomViewActive = false;

    // Last uploaded part info for auto-loading in viewer
    private String lastUploadedCadfileUuid;
    private String lastUploadedPartPersid;

    // Flat tree for custom HTML rendering
    private List<FlatTreeNode> flatTreeNodes;
    private Set<String> expandedNodes = new HashSet<>();

    private String destination = PathConfig.getProjectsPath();
        
    
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

    public void savePartName(TreeNodeData nodeData) {
        if (nodeData == null || nodeData.getPart() == null) {
            return;
        }
        Part part = em.find(Part.class, nodeData.getPart().getId());
        if (part != null) {
            part.setName(nodeData.getName());
            System.out.println("Saved part name: " + nodeData.getName());
        }
    }

    public void saveAssemblyName(TreeNodeData nodeData) {
        if (nodeData == null || nodeData.getAssembly() == null) {
            return;
        }
        Assembly assembly = em.find(Assembly.class, nodeData.getAssembly().getId());
        if (assembly != null) {
            assembly.setName(nodeData.getName());
            System.out.println("Saved assembly name: " + nodeData.getName());
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
            if (p.getShape() == null) {
                qp.setPrice(BigDecimal.ZERO);
                qps.add(qp);
                continue;
            }
            if (p.getShape().getKey().equals("SHEET_METAL_FLAT") || p.getShape().getKey().equals("SHEET_METAL_FOLDED")) {
                BigDecimal price = BigDecimal.ZERO;
                try {
                    if (p.getMaterial() == null) {
                        System.out.println("Part has no material assigned, skipping price calculation");
                    } else {
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
                        BigDecimal cs = new BigDecimal(28.5);
                        BigDecimal pPrice = p.getFlatTotalContourLength().divide(cs, 2, RoundingMode.HALF_UP);
                        pPrice = pPrice.multiply((fp.getPriceph().divide(BigDecimal.valueOf(3600), 2, RoundingMode.HALF_UP)));

                        price = price.add(pPrice);

                        // Press break down curtain -> 10 segs
                        FabProcess fppb = (FabProcess)em.find(FabProcess.class, 3L);
                        BigDecimal ppb = (fppb.getPriceph()).divide(new BigDecimal(60),2, RoundingMode.HALF_UP);
                        ppb = ppb.divide(new BigDecimal(6), 2, RoundingMode.HALF_UP);

                        if (p.getShape().getKey().equals("SHEET_METAL_FOLDED")) {
                            price = price.add(ppb.multiply(new BigDecimal(qp.getPart().getBends())));
                        }
                    }
                } catch (Exception ex) {
                    System.out.println("Error while calculating price: " + ex.getMessage());
                    price = BigDecimal.ZERO;
                }
                qp.setPrice(price);

                } else if (p.getShape().getKey().equals("TUBE_RECTANGULAR") ) {
                    BigDecimal price = BigDecimal.ZERO;
                    try {
                        if (p.getMaterial() != null) {
                            Property density = (Property)em.createQuery("select den from Property den where "
                                    + "den.product=:product and den.propertyType.key='DENSITY'")
                                    .setParameter("product", p.getMaterial()).getSingleResult();

                            Property ppk = (Property)em.createQuery("select ppk from Property ppk where "
                                    + "ppk.product=:product and ppk.propertyType.key='PRICEPERKG'")
                                    .setParameter("product", p.getMaterial()).getSingleResult();

                            price = p.getVolume().divide(BigDecimal.valueOf(1000000000));
                            price = price.multiply(density.getValue());
                            price = price.multiply(ppk.getValue());
                        }
                    } catch (Exception ex) {
                        System.out.println("Error calculating price for TUBE_RECTANGULAR: " + ex.getMessage());
                        price = BigDecimal.ZERO;
                    }
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
            if (getActiveProject().getId() != null) {
                activeProject = em.find(Project.class, getActiveProject().getId());
            } else {
                // Project exists in memory but not persisted yet
                em.persist(getActiveProject());
            }
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
            Process pr = null;
            try{ 
                pr = rt.exec(command);
            } catch (Exception e) {
                System.out.println("Error while trying to execute stepguru: "+e.getMessage());
            }
            BufferedReader reader = new BufferedReader(new InputStreamReader(pr.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(request.getSession().getId()+ " : " +line);
                if (line.startsWith("******") || line.contains("info")) {
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
                        p.setShape(em.find(Category.class, 9L));  // BENT_TUBE_RECTANGULAR
                        p.setSectionWidth(d.getJsonNumber("width").bigDecimalValue());
                        p.setSectionHeight(d.getJsonNumber("height").bigDecimalValue());
                        p.setPartLength(d.getJsonNumber("length").bigDecimalValue());
                        p.setThickness(d.getJsonNumber("thickness").bigDecimalValue());
                        p.setTotalArea(d.getJsonNumber("surfaceArea").bigDecimalValue());
                        p.setVolume(d.getJsonNumber("volume").bigDecimalValue());
                    }
                    if (partType.equals("TUBE_RECTANGULAR")) {
                        p.setShape(em.find(Category.class, 7L));  // TUBE_RECTANGULAR
                        p.setSectionWidth(d.getJsonNumber("width").bigDecimalValue());
                        p.setSectionHeight(d.getJsonNumber("height").bigDecimalValue());
                        p.setPartLength(d.getJsonNumber("length").bigDecimalValue());
                        p.setThickness(d.getJsonNumber("thickness").bigDecimalValue());
                        p.setTotalArea(d.getJsonNumber("surfaceArea").bigDecimalValue());
                        p.setVolume(d.getJsonNumber("volume").bigDecimalValue());
                    }
                    if (partType.equals("TUBE_ROUND_BENT")) {
                        p.setShape(em.find(Category.class, 10L));  // BENT_TUBE_ROUND
                        p.setDiameter(d.getJsonNumber("diameter").bigDecimalValue());
                        p.setPartLength(d.getJsonNumber("length").bigDecimalValue());
                        p.setThickness(d.getJsonNumber("thickness").bigDecimalValue());
                        p.setTotalArea(d.getJsonNumber("surfaceArea").bigDecimalValue());
                        p.setVolume(d.getJsonNumber("volume").bigDecimalValue());
                    }
                    if (partType.equals("TUBE_ROUND")) {
                        p.setShape(em.find(Category.class, 8L));  // TUBE_ROUND
                        p.setDiameter(d.getJsonNumber("diameter").bigDecimalValue());
                        p.setPartLength(d.getJsonNumber("length").bigDecimalValue());
                        p.setThickness(d.getJsonNumber("thickness").bigDecimalValue());
                        p.setTotalArea(d.getJsonNumber("surfaceArea").bigDecimalValue());
                        p.setVolume(d.getJsonNumber("volume").bigDecimalValue());
                    }
                    if (partType.equals("SHEET_METAL_FLAT")) {
                        p.setShape(em.find(Category.class, 5L));  // SHEET_METAL_FLAT
                        p.setThickness(d.getJsonNumber("thickness").bigDecimalValue());
                        p.setFlatTotalContourLength(d.getJsonNumber("cutLength").bigDecimalValue());
                        p.setTotalArea(d.getJsonNumber("surfaceArea").bigDecimalValue());
                        p.setVolume(d.getJsonNumber("volume").bigDecimalValue());
                        p.setFlatObbWidth(d.getJsonNumber("flatPatternWidth").bigDecimalValue());
                        p.setFlatObbLength(d.getJsonNumber("flatPatternLength").bigDecimalValue());
                    }
                    if (partType.equals("SHEET_METAL_FOLDED")) {
                        p.setShape(em.find(Category.class, 6L));  // SHEET_METAL_FOLDED
                        p.setThickness(d.getJsonNumber("thickness").bigDecimalValue());
                        p.setFlatTotalContourLength(d.getJsonNumber("cutLength").bigDecimalValue());
                        p.setTotalArea(d.getJsonNumber("surfaceArea").bigDecimalValue());
                        p.setVolume(d.getJsonNumber("volume").bigDecimalValue());
                        p.setBends(d.getJsonNumber("numBends").longValue());
                        p.setFlatObbWidth(d.getJsonNumber("flatPatternWidth").bigDecimalValue());
                        p.setFlatObbLength(d.getJsonNumber("flatPatternLength").bigDecimalValue());
                    }
                    if (partType.equals("UNKNOWN")) {
                        p.setShape(em.find(Category.class, 4L));  // UNRECOGNIZED
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
            if (rootAssembly != null) {
                em.persist(rootAssembly);  // Cascades to child assemblies and their parts
                System.out.println("Successfully persisted CADFile and assembly tree");
            } else {
                System.out.println("Successfully persisted CADFile (single part, no assembly)");
            }

        // STEP 4: Run amatix for folded sheet metal parts
            System.out.println("\n=== Running Amatix for Folded Sheet Metal Parts ===");
            System.out.println("CADFile has " + f.getParts().size() + " parts");
            for (Object entity : definitionsEntityMap.values()) {
                if (entity instanceof Part) {
                    Part part = (Part) entity;
                    System.out.println("Checking part: " + part.getName() + " with shape: " +
                        (part.getShape() != null ? part.getShape().getKey() : "null"));
                    if (part.getShape() != null && part.getShape().getKey().equals("SHEET_METAL_FOLDED")) {
                        System.out.println("Found SHEET_METAL_FOLDED part: " + part.getName() + " persid: " + part.getPersid());
                        runAmatix(filedest, part);
                    }
                }
            }

        } catch (IOException ex) {
            System.getLogger(ProjectController.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
        }




        // Invalidate cached tree since new data was added
        invalidateAssemblyTree();

        // Store last uploaded part info for auto-loading in viewer
        // Clear first to avoid stale data mismatch
        lastUploadedCadfileUuid = null;
        lastUploadedPartPersid = null;

        if (!f.getParts().isEmpty()) {
            lastUploadedCadfileUuid = f.getUuid();
            lastUploadedPartPersid = f.getParts().iterator().next().getPersid();
        } else if (f.getRoot() != null) {
            lastUploadedCadfileUuid = f.getUuid();
            lastUploadedPartPersid = f.getRoot().getPersid();
        }
        // If neither condition is true, both remain null and hasLastUploaded returns false

        // TODO: Do not redirect if it is the same page!!!
        try {
            externalContext.redirect("project.xhtml");
        } catch (IOException e) {
            // Handle the IOException
            e.printStackTrace();
        }
    }

    private void runAmatix(String filedest, Part part) {
        String persid = part.getPersid();
        try {
            String stepFile = filedest + "out_" + persid + "_1.step";
            String outDir = filedest + persid + "-cam_simulation";

            // Check if STEP file exists
            if (!Files.exists(Paths.get(stepFile))) {
                System.out.println("Amatix: STEP file not found: " + stepFile);
                userController.sendUpdate("Skipping bend simulation - STEP file not found for " + persid);
                return;
            }

            // Create output directory if it doesn't exist
            Path outPath = Paths.get(outDir);
            if (!Files.exists(outPath)) {
                Files.createDirectories(outPath);
            }

            String command = String.format(
                "/usr/local/bin/amatix %s --tool-dir /usr/local/share/amatix/tools --margin 0.005 --out-dir %s",
                stepFile, outDir
            );

            System.out.println("* = - = * = - = Executing Amatix for " + persid + " * = - = * = - = *");
            userController.sendUpdate("Running bend simulation for " + persid + "...");

            Runtime rt = Runtime.getRuntime();
            Process pr = rt.exec(command);

            BufferedReader reader = new BufferedReader(new InputStreamReader(pr.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println("amatix: " + line);
                if (line.contains("info") || line.contains("error") || line.contains("warning")) {
                    userController.sendUpdate(line);
                }
            }

            BufferedReader errorReader = new BufferedReader(new InputStreamReader(pr.getErrorStream()));
            while ((line = errorReader.readLine()) != null) {
                System.out.println("amatix error: " + line);
            }

            int exitCode = pr.waitFor();
            if (exitCode == 0) {
                System.out.println("Amatix completed successfully for " + persid);
                userController.sendUpdate("Bend simulation complete for " + persid);

                // Parse simulation.json to check for collisions and warnings
                parseSimulationResults(outDir, part);
            } else {
                System.out.println("Amatix failed with exit code " + exitCode + " for " + persid);
                userController.sendUpdate("Bend simulation failed for " + persid);
            }

        } catch (IOException | InterruptedException ex) {
            System.getLogger(ProjectController.class.getName()).log(System.Logger.Level.ERROR,
                "Error running amatix for " + persid, ex);
            userController.sendUpdate("Error running bend simulation for " + persid);
        }
    }

    /**
     * Parse simulation.json to extract collision and warning information.
     */
    private void parseSimulationResults(String outDir, Part part) {
        Path simulationFile = Paths.get(outDir, "simulation.json");

        if (!Files.exists(simulationFile)) {
            System.out.println("simulation.json not found at: " + simulationFile);
            return;
        }

        try {
            String jsonContent = Files.readString(simulationFile);
            JsonReader jsonReader = Json.createReader(new java.io.StringReader(jsonContent));
            JsonObject simulation = jsonReader.readObject();
            jsonReader.close();

            // Check for warnings
            JsonArray warnings = simulation.getJsonArray("warnings");
            boolean hasWarnings = warnings != null && !warnings.isEmpty();
            part.setHasWarnings(hasWarnings);

            if (hasWarnings) {
                // Store warnings as JSON string
                part.setSimulationWarnings(warnings.toString());
                System.out.println("Part " + part.getName() + " has " + warnings.size() + " warnings");
                for (int i = 0; i < warnings.size(); i++) {
                    System.out.println("  Warning: " + warnings.getString(i));
                }
            }

            // Check for collisions in any bend sequence step
            boolean hasCollisions = false;
            JsonArray sequence = simulation.getJsonArray("sequence");
            if (sequence != null) {
                for (int i = 0; i < sequence.size(); i++) {
                    JsonObject step = sequence.getJsonObject(i);
                    JsonArray collisions = step.getJsonArray("collisions");
                    if (collisions != null && !collisions.isEmpty()) {
                        hasCollisions = true;
                        System.out.println("Part " + part.getName() + " has collisions at step " +
                            step.getInt("stepIndex") + ": " + collisions.toString());
                        break;
                    }
                }
            }
            part.setHasCollisions(hasCollisions);

            if (hasCollisions) {
                System.out.println("Part " + part.getName() + " is INFEASIBLE (has collisions)");
                userController.sendUpdate("WARNING: Part " + part.getName() + " has collisions - infeasible!");
            } else if (hasWarnings) {
                System.out.println("Part " + part.getName() + " is feasible but has warnings");
                userController.sendUpdate("Part " + part.getName() + " has manufacturing warnings");
            } else {
                System.out.println("Part " + part.getName() + " is fully feasible");
            }

            // Part is already managed by EntityManager, changes will be persisted
            em.merge(part);

        } catch (IOException e) {
            System.err.println("Error reading simulation.json: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Error parsing simulation.json: " + e.getMessage());
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

                        // Create Instance entity with transformation
                        Instance inst = createInstanceFromJson(childInstance, childPart, null, cadFile);
                        if (inst != null) {
                            em.persist(inst);
                            System.out.println("Created instance for part: " + childPart.getName() +
                                             " persid: " + inst.getPersid() +
                                             " hasTransform: " + inst.hasTransform());
                        }
                    }
                }
            }

            System.out.println("Built assembly: " + assembly.getName() +
                              " [" + assembly.getAssemblies().size() + " sub-assemblies, " +
                              assembly.getParts().size() + " parts]");

            return assembly;
        }

        // Handle case where root is a single Part (not an Assembly)
        if (entity instanceof Part) {
            Part part = (Part) entity;
            cadFile.getParts().add(part);
            System.out.println("Added single part to CADFile: " + part.getName());

            // Create Instance entity for root part
            Instance inst = createInstanceFromJson(instance, part, null, cadFile);
            if (inst != null) {
                em.persist(inst);
                System.out.println("Created instance for root part: " + part.getName());
            }
        }

        return null;
    }

    /**
     * Create an Instance entity from the assembly.json instance node.
     * Extracts the transformation matrix if present.
     */
    private Instance createInstanceFromJson(JsonObject instanceJson, Part part, Assembly assembly, CADFile cadFile) {
        Instance inst = new Instance();
        inst.setCadfile(cadFile);
        inst.setPart(part);
        inst.setAssembly(assembly);

        // Get the instance persid from JSON
        String persid = instanceJson.getString("id");
        inst.setPersid(persid);

        // Extract transformation matrix if present
        if (instanceJson.containsKey("transform") && !instanceJson.isNull("transform")) {
            JsonArray transformArray = instanceJson.getJsonArray("transform");
            if (transformArray != null && transformArray.size() == 16) {
                double[] transform = new double[16];
                for (int i = 0; i < 16; i++) {
                    transform[i] = transformArray.getJsonNumber(i).doubleValue();
                }
                inst.setTransformFromArray(transform);
                System.out.println("  Transform set for " + persid + ": Tx=" +
                    String.format("%.2f", inst.getTranslationX()) + " Ty=" +
                    String.format("%.2f", inst.getTranslationY()) + " Tz=" +
                    String.format("%.2f", inst.getTranslationZ()));
            }
        }

        return inst;
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

    
    public Part getFirstPart() {
        if (activeProject == null || activeProject.getCadfiles() == null) {
            return null;
        }
        for (CADFile cf : activeProject.getCadfiles()) {
            if (cf.getParts() != null && !cf.getParts().isEmpty()) {
                return cf.getParts().iterator().next();
            }
        }
        return null;
    }

    public CADFile getFirstCadFile() {
        if (activeProject == null || activeProject.getCadfiles() == null || activeProject.getCadfiles().isEmpty()) {
            return null;
        }
        return activeProject.getCadfiles().get(0);
    }

    public boolean hasSimulationData(Part part, CADFile cf) {
        if (activeProject == null || part == null || cf == null) {
            System.out.println("hasSimulationData: null check failed - activeProject=" + activeProject +
                ", part=" + part + ", cf=" + cf);
            return false;
        }
        String simPath = destination + activeProject.getUuid() + "/" +
                        cf.getUuid() + "/" + part.getPersid() + "-cam_simulation/blueprint.json";
        boolean exists = Files.exists(Paths.get(simPath));
        System.out.println("hasSimulationData: checking path=" + simPath + " exists=" + exists);
        return exists;
    }

    public String getSimulationPath(Part part, CADFile cf) {
        if (activeProject == null || part == null || cf == null) {
            return null;
        }
        return activeProject.getUuid() + "/" + cf.getUuid() + "/" + part.getPersid() + "-cam_simulation/";
    }

    public TreeNode<TreeNodeData> getAssemblyTree() {
        if (activeProject == null || activeProject.getId() == null) {
            cachedAssemblyTree = null;
            cachedProjectId = null;
            return new DefaultTreeNode<>(new TreeNodeData("Project", "project", null), null);
        }

        // Return cached tree if still valid for same project
        if (cachedAssemblyTree != null && activeProject.getId().equals(cachedProjectId)) {
            return cachedAssemblyTree;
        }

        // Build new tree
        TreeNode<TreeNodeData> root = new DefaultTreeNode<>(new TreeNodeData("Project", "project", null), null);

        // Re-fetch project using query to bypass cache and ensure fresh data
        Project project;
        try {
            project = em.createQuery(
                "SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.cadfiles cf LEFT JOIN FETCH cf.root WHERE p.id = :id", Project.class)
                .setParameter("id", activeProject.getId())
                .getSingleResult();
        } catch (Exception e) {
            System.out.println("Error fetching project: " + e.getMessage());
            // Reset activeProject if it doesn't exist in the database
            activeProject = null;
            cachedAssemblyTree = null;
            cachedProjectId = null;
            return root;
        }
        if (project == null || project.getCadfiles() == null) {
            return root;
        }
        System.out.println("Fetched project with " + project.getCadfiles().size() + " cadfiles");

        for (CADFile cf : project.getCadfiles()) {
            if (cf.getRoot() != null) {
                // Has assembly structure
                buildAssemblyTree(cf.getRoot(), root, cf);
            } else if (cf.getParts() != null && !cf.getParts().isEmpty()) {
                // Single parts without assembly structure
                for (Part part : cf.getParts()) {
                    TreeNodeData partData = new TreeNodeData(part.getName(), "part", part);
                    partData.setCadfile(cf);
                    partData.setPrice(BigDecimal.ZERO);
                    partData.setQuantity(1);
                    partData.setFoldedSheetMetal(isFoldedSheetMetal(part));
                    partData.setHasSimulation(hasSimulationData(part, cf));
                    partData.setSimulationPath(getSimulationPath(part, cf));
                    new DefaultTreeNode<>("part", partData, root);
                }
            }
        }

        // Cache the tree
        cachedAssemblyTree = root;
        cachedProjectId = activeProject.getId();
        treeQuoted = false;

        // Generate quotes for the tree
        quotingEngine.processTree(root);
        treeQuoted = true;

        return root;
    }

    /**
     * Invalidate the cached assembly tree (call when project changes)
     */
    public void invalidateAssemblyTree() {
        cachedAssemblyTree = null;
        cachedProjectId = null;
        treeQuoted = false;

        // Refresh activeProject from database to get fresh data
        if (activeProject != null && activeProject.getId() != null) {
            Long projectId = activeProject.getId();
            // Use query to bypass EntityManager cache
            try {
                activeProject = em.createQuery(
                    "SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.cadfiles cf LEFT JOIN FETCH cf.root WHERE p.id = :id", Project.class)
                    .setParameter("id", projectId)
                    .getSingleResult();
                System.out.println("Refreshed activeProject from database, cadfiles count: " +
                    (activeProject.getCadfiles() != null ? activeProject.getCadfiles().size() : 0));
            } catch (Exception e) {
                System.out.println("Project no longer exists: " + e.getMessage());
                activeProject = null;
            }
        }
    }

    /**
     * Delete a part or assembly from the project
     */
    public void deleteNode(TreeNodeData nodeData) {
        System.out.println("=== deleteNode START ===");
        System.out.println("deleteNode called with: " + (nodeData != null ? nodeData.getType() + " - " + nodeData.getName() : "null"));

        if (nodeData == null) {
            System.out.println("nodeData is null, returning");
            return;
        }

        try {
            if ("part".equals(nodeData.getType()) && nodeData.getPart() != null) {
                Long partId = nodeData.getPart().getId();
                System.out.println("Attempting to delete part ID: " + partId);

                Part part = em.find(Part.class, partId);
                System.out.println("em.find returned: " + (part != null ? "part found" : "NULL"));

                if (part != null) {
                    // Remove from CADFile's parts collection
                    CADFile cadfile = part.getCadfile();
                    if (cadfile != null && cadfile.getParts() != null) {
                        cadfile.getParts().remove(part);
                        System.out.println("Removed part from CADFile.parts");
                    }

                    // Find and remove from parent Assembly's parts collection
                    List<Assembly> parentAssemblies = em.createQuery(
                        "SELECT a FROM Assembly a JOIN a.parts p WHERE p.id = :partId", Assembly.class)
                        .setParameter("partId", partId)
                        .getResultList();
                    System.out.println("Found " + parentAssemblies.size() + " parent assemblies");

                    for (Assembly parentAssembly : parentAssemblies) {
                        parentAssembly.getParts().remove(part);
                        System.out.println("Removed part from Assembly.parts");
                    }

                    // Now delete the part
                    em.remove(part);
                    System.out.println("Part deleted successfully");
                } else {
                    System.out.println("Part not found in database!");
                }
            } else if ("assembly".equals(nodeData.getType()) && nodeData.getAssembly() != null) {
                Long assemblyId = nodeData.getAssembly().getId();
                System.out.println("Attempting to delete assembly ID: " + assemblyId);

                Assembly assembly = em.find(Assembly.class, assemblyId);
                System.out.println("em.find returned: " + (assembly != null ? "assembly found" : "NULL"));

                if (assembly != null) {
                    // Get CADFile info for filesystem cleanup BEFORE modifying entities
                    CADFile cadfileForFiles = nodeData.getCadfile();
                    String cadfileUuid = (cadfileForFiles != null) ? cadfileForFiles.getUuid() : null;

                    // Collect all parts and assemblies for file deletion BEFORE modifying entities
                    List<Part> allParts = new ArrayList<>();
                    collectPartsFromAssembly(assembly, allParts);
                    List<Assembly> allAssemblies = new ArrayList<>();
                    collectAssembliesFromAssembly(assembly, allAssemblies);

                    // Collect persids for file deletion
                    List<String> partPersids = new ArrayList<>();
                    for (Part p : allParts) {
                        if (p.getPersid() != null) partPersids.add(p.getPersid());
                    }
                    List<String> assemblyPersids = new ArrayList<>();
                    for (Assembly a : allAssemblies) {
                        if (a.getPersid() != null) assemblyPersids.add(a.getPersid());
                    }
                    System.out.println("Collected " + allParts.size() + " parts and " + allAssemblies.size() + " assemblies");

                    // Remove from parent's assemblies collection
                    Assembly parent = assembly.getParent();
                    if (parent != null) {
                        parent.getAssemblies().remove(assembly);
                        System.out.println("Removed assembly from parent");
                    }

                    // Remove parts from their CADFile collections
                    for (Part part : allParts) {
                        CADFile cf = part.getCadfile();
                        if (cf != null) {
                            CADFile managedCf = em.find(CADFile.class, cf.getId());
                            if (managedCf != null && managedCf.getParts() != null) {
                                managedCf.getParts().remove(part);
                                System.out.println("Removed part " + part.getId() + " from CADFile " + managedCf.getId());
                            }
                        }
                    }

                    // Find CADFiles that reference this assembly as root
                    List<CADFile> referencingCadFiles = em.createQuery(
                        "SELECT cf FROM CADFile cf WHERE cf.root.id = :assemblyId", CADFile.class)
                        .setParameter("assemblyId", assemblyId)
                        .getResultList();

                    // Collect CADFile UUIDs for directory deletion
                    List<String> cadfileUuidsToDelete = new ArrayList<>();
                    for (CADFile cf : referencingCadFiles) {
                        if (cf.getUuid() != null) cadfileUuidsToDelete.add(cf.getUuid());
                    }

                    // Clear CADFile root references before deleting assembly
                    for (CADFile cf : referencingCadFiles) {
                        cf.setRoot(null);
                        System.out.println("Cleared CADFile root reference for CADFile ID: " + cf.getId());
                    }

                    // Delete the assembly (cascade should handle parts and children)
                    em.remove(assembly);
                    System.out.println("Assembly deleted successfully");

                    // Now delete the CADFiles that had this as root
                    for (CADFile cf : referencingCadFiles) {
                        System.out.println("Deleting CADFile (root assembly was deleted): " + cf.getId());

                        // Remove from project's cadfiles collection (get managed version)
                        Project managedProject = em.find(Project.class, activeProject.getId());
                        if (managedProject != null && managedProject.getCadfiles() != null) {
                            managedProject.getCadfiles().remove(cf);
                        }

                        // Delete the CADFile entity
                        em.remove(cf);
                        System.out.println("CADFile deleted: " + cf.getId());
                    }

                    // NOW delete files from filesystem (after all DB operations)
                    if (activeProject != null && !cadfileUuidsToDelete.isEmpty()) {
                        for (String cfUuid : cadfileUuidsToDelete) {
                            deleteCadFileDirectoryByUuid(cfUuid);
                        }
                    } else if (activeProject != null && cadfileUuid != null) {
                        // Delete individual part/assembly files if not deleting whole CADFile
                        for (String persid : partPersids) {
                            deletePartFilesByPersid(cadfileUuid, persid);
                        }
                        for (String persid : assemblyPersids) {
                            deleteAssemblyFilesByPersid(cadfileUuid, persid);
                        }
                    }
                } else {
                    System.out.println("Assembly not found in database!");
                }
            }
            invalidateAssemblyTree();
            System.out.println("=== deleteNode END ===");
        } catch (Exception e) {
            System.out.println("Error deleting: " + e.getMessage());
            e.printStackTrace();
            FacesContext.getCurrentInstance().addMessage(null,
                new FacesMessage(FacesMessage.SEVERITY_ERROR, "Error", "Could not delete: " + e.getMessage()));
        }
    }

    /**
     * Delete an entire project and all its contents.
     */
    public void deleteProject(Project project) {
        System.out.println("=== deleteProject START ===");
        if (project == null) {
            System.out.println("Project is null, returning");
            return;
        }

        try {
            Long projectId = project.getId();
            String projectUuid = project.getUuid();
            System.out.println("Deleting project: " + project.getName() + " (ID: " + projectId + ")");

            // Get managed project from database
            Project managedProject = em.find(Project.class, projectId);
            if (managedProject == null) {
                System.out.println("Project not found in database");
                return;
            }

            // FIRST: Remove from user's projects list (clears join table FK reference)
            User user = em.find(User.class, userController.getUser().getId());
            if (user != null && user.getProjects() != null) {
                user.getProjects().remove(managedProject);
                System.out.println("Removed project from user's list");
            }

            // Clear activeProject if it was the deleted project
            if (activeProject != null && activeProject.getId().equals(projectId)) {
                activeProject = null;
                invalidateAssemblyTree();
            }

            // Manually delete all CADFiles and their contents
            if (managedProject.getCadfiles() != null) {
                // Create a copy to avoid ConcurrentModificationException
                List<CADFile> cadfilesToDelete = new ArrayList<>(managedProject.getCadfiles());

                for (CADFile cf : cadfilesToDelete) {
                    System.out.println("Deleting CADFile: " + cf.getId());

                    // Clear root reference first
                    Assembly root = cf.getRoot();
                    if (root != null) {
                        cf.setRoot(null);

                        // Delete the root assembly and all its children
                        em.remove(root);
                        System.out.println("Deleted root assembly: " + root.getId());
                    }

                    // Delete all parts
                    if (cf.getParts() != null) {
                        for (Part part : new ArrayList<>(cf.getParts())) {
                            em.remove(part);
                        }
                        cf.getParts().clear();
                        System.out.println("Deleted parts for CADFile: " + cf.getId());
                    }

                    // Remove from project's cadfiles list
                    managedProject.getCadfiles().remove(cf);

                    // Delete the CADFile
                    em.remove(cf);
                    System.out.println("Deleted CADFile: " + cf.getId());
                }
            }

            // Delete the project
            em.remove(managedProject);
            System.out.println("Project deleted from database");

            // Delete project directory from filesystem
            if (projectUuid != null) {
                deleteProjectDirectory(projectUuid);
            }

            System.out.println("=== deleteProject END ===");
        } catch (Exception e) {
            System.out.println("Error deleting project: " + e.getMessage());
            e.printStackTrace();
            FacesContext.getCurrentInstance().addMessage(null,
                new FacesMessage(FacesMessage.SEVERITY_ERROR, "Error", "Could not delete project: " + e.getMessage()));
        }
    }

    /**
     * Deletes the entire project directory from the filesystem.
     */
    private void deleteProjectDirectory(String projectUuid) {
        if (projectUuid == null) {
            return;
        }

        String dirPath = destination + projectUuid;
        try {
            Path dir = Paths.get(dirPath);
            if (Files.exists(dir) && Files.isDirectory(dir)) {
                Files.walk(dir)
                    .sorted((a, b) -> b.compareTo(a)) // Reverse order to delete contents first
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                            System.out.println("Deleted: " + path);
                        } catch (IOException e) {
                            System.out.println("Error deleting " + path + ": " + e.getMessage());
                        }
                    });
                System.out.println("Deleted project directory: " + dirPath);
            }
        } catch (IOException e) {
            System.out.println("Error deleting project directory: " + e.getMessage());
        }
    }

    private void buildAssemblyTree(Assembly assembly, TreeNode<TreeNodeData> parentNode, CADFile cf) {
        TreeNodeData data = new TreeNodeData(assembly.getName(), "assembly", null);
        data.setAssembly(assembly);
        data.setCadfile(cf);
        TreeNode<TreeNodeData> assemblyNode = new DefaultTreeNode<>("assembly", data, parentNode);
        assemblyNode.setExpanded(true);

        // Track unique child assemblies by persid
        Map<String, TreeNodeData> uniqueAssemblies = new HashMap<>();
        Map<String, Assembly> assemblyMap = new HashMap<>();

        if (assembly.getAssemblies() != null) {
            for (Assembly childAssembly : assembly.getAssemblies()) {
                String persid = childAssembly.getPersid();
                if (uniqueAssemblies.containsKey(persid)) {
                    uniqueAssemblies.get(persid).setQuantity(uniqueAssemblies.get(persid).getQuantity() + 1);
                } else {
                    TreeNodeData childData = new TreeNodeData(childAssembly.getName(), "assembly", null);
                    childData.setAssembly(childAssembly);
                    childData.setCadfile(cf);
                    uniqueAssemblies.put(persid, childData);
                    assemblyMap.put(persid, childAssembly);
                }
            }
        }

        // Add unique child assemblies and recurse
        for (String persid : uniqueAssemblies.keySet()) {
            TreeNodeData childData = uniqueAssemblies.get(persid);
            TreeNode<TreeNodeData> childNode = new DefaultTreeNode<>("assembly", childData, assemblyNode);
            childNode.setExpanded(true);

            // Recurse into child assembly's children
            Assembly childAssembly = assemblyMap.get(persid);
            addChildrenToNode(childAssembly, childNode, cf);
        }

        // Track unique parts by persid
        Map<String, TreeNodeData> uniqueParts = new HashMap<>();

        if (assembly.getParts() != null) {
            for (Part part : assembly.getParts()) {
                String persid = part.getPersid();
                if (uniqueParts.containsKey(persid)) {
                    uniqueParts.get(persid).setQuantity(uniqueParts.get(persid).getQuantity() + 1);
                } else {
                    TreeNodeData partData = new TreeNodeData(part.getName(), "part", part);
                    partData.setCadfile(cf);
                    partData.setPrice(BigDecimal.ZERO);
                    partData.setFoldedSheetMetal(isFoldedSheetMetal(part));
                    partData.setHasSimulation(hasSimulationData(part, cf));
                    partData.setSimulationPath(getSimulationPath(part, cf));
                    uniqueParts.put(persid, partData);
                }
            }
        }

        // Add unique parts
        for (TreeNodeData partData : uniqueParts.values()) {
            new DefaultTreeNode<>("part", partData, assemblyNode);
        }
    }

    private void addChildrenToNode(Assembly assembly, TreeNode<TreeNodeData> parentNode, CADFile cf) {
        // Track unique child assemblies by persid
        Map<String, TreeNodeData> uniqueAssemblies = new HashMap<>();
        Map<String, Assembly> assemblyMap = new HashMap<>();

        if (assembly.getAssemblies() != null) {
            for (Assembly childAssembly : assembly.getAssemblies()) {
                String persid = childAssembly.getPersid();
                if (uniqueAssemblies.containsKey(persid)) {
                    uniqueAssemblies.get(persid).setQuantity(uniqueAssemblies.get(persid).getQuantity() + 1);
                } else {
                    TreeNodeData childData = new TreeNodeData(childAssembly.getName(), "assembly", null);
                    childData.setAssembly(childAssembly);
                    childData.setCadfile(cf);
                    uniqueAssemblies.put(persid, childData);
                    assemblyMap.put(persid, childAssembly);
                }
            }
        }

        // Add unique child assemblies and recurse
        for (String persid : uniqueAssemblies.keySet()) {
            TreeNodeData childData = uniqueAssemblies.get(persid);
            TreeNode<TreeNodeData> childNode = new DefaultTreeNode<>("assembly", childData, parentNode);
            childNode.setExpanded(true);

            Assembly childAssembly = assemblyMap.get(persid);
            addChildrenToNode(childAssembly, childNode, cf);
        }

        // Track unique parts by persid
        Map<String, TreeNodeData> uniqueParts = new HashMap<>();

        if (assembly.getParts() != null) {
            for (Part part : assembly.getParts()) {
                String persid = part.getPersid();
                if (uniqueParts.containsKey(persid)) {
                    uniqueParts.get(persid).setQuantity(uniqueParts.get(persid).getQuantity() + 1);
                } else {
                    TreeNodeData partData = new TreeNodeData(part.getName(), "part", part);
                    partData.setCadfile(cf);
                    partData.setPrice(BigDecimal.ZERO);
                    partData.setFoldedSheetMetal(isFoldedSheetMetal(part));
                    partData.setHasSimulation(hasSimulationData(part, cf));
                    partData.setSimulationPath(getSimulationPath(part, cf));
                    uniqueParts.put(persid, partData);
                }
            }
        }

        // Add unique parts
        for (TreeNodeData partData : uniqueParts.values()) {
            new DefaultTreeNode<>("part", partData, parentNode);
        }
    }

    private boolean isFoldedSheetMetal(Part part) {
        if (part == null) {
            System.out.println("isFoldedSheetMetal: part is null");
            return false;
        }
        if (part.getShape() == null) {
            System.out.println("isFoldedSheetMetal: part " + part.getName() + " (persid=" + part.getPersid() + ") has null shape");
            return false;
        }
        String shapeKey = part.getShape().getKey();
        boolean isFolded = "SHEET_METAL_FOLDED".equals(shapeKey);
        System.out.println("isFoldedSheetMetal: part " + part.getName() + " (persid=" + part.getPersid() + ") shape=" + shapeKey + " isFolded=" + isFolded);
        return isFolded;
    }

    /**
     * Recursively collects all parts from an assembly and its child assemblies.
     */
    private void collectPartsFromAssembly(Assembly assembly, List<Part> allParts) {
        if (assembly == null) return;

        // Add direct parts
        if (assembly.getParts() != null) {
            allParts.addAll(assembly.getParts());
        }

        // Recurse into child assemblies
        if (assembly.getAssemblies() != null) {
            for (Assembly child : assembly.getAssemblies()) {
                collectPartsFromAssembly(child, allParts);
            }
        }
    }

    /**
     * Recursively collects all assemblies from an assembly hierarchy (including the root).
     */
    private void collectAssembliesFromAssembly(Assembly assembly, List<Assembly> allAssemblies) {
        if (assembly == null) return;

        allAssemblies.add(assembly);

        if (assembly.getAssemblies() != null) {
            for (Assembly child : assembly.getAssemblies()) {
                collectAssembliesFromAssembly(child, allAssemblies);
            }
        }
    }

    /**
     * Deletes all files associated with a part from the filesystem.
     */
    private void deletePartFiles(CADFile cadfile, Part part) {
        if (activeProject == null || cadfile == null || part == null || part.getPersid() == null) {
            return;
        }

        String basePath = destination + activeProject.getUuid() + "/" + cadfile.getUuid() + "/";
        String persid = part.getPersid().replaceAll(":", "-");

        // Files to delete for a part
        String[] filesToDelete = {
            "out_" + persid + "_1.glb",
            "out_" + persid + "_1.step",
            "image_" + persid + "_1.png"
        };

        for (String filename : filesToDelete) {
            try {
                Path filePath = Paths.get(basePath + filename);
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    System.out.println("Deleted file: " + filePath);
                }
            } catch (IOException e) {
                System.out.println("Error deleting file " + filename + ": " + e.getMessage());
            }
        }

        // Delete simulation directory if exists
        String simDirPath = basePath + persid + "-cam_simulation";
        try {
            Path simDir = Paths.get(simDirPath);
            if (Files.exists(simDir) && Files.isDirectory(simDir)) {
                Files.walk(simDir)
                    .sorted((a, b) -> b.compareTo(a)) // Reverse order to delete contents first
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                            System.out.println("Deleted: " + path);
                        } catch (IOException e) {
                            System.out.println("Error deleting " + path + ": " + e.getMessage());
                        }
                    });
                System.out.println("Deleted simulation directory: " + simDirPath);
            }
        } catch (IOException e) {
            System.out.println("Error deleting simulation directory: " + e.getMessage());
        }
    }

    /**
     * Deletes all files associated with an assembly from the filesystem.
     */
    private void deleteAssemblyFiles(CADFile cadfile, Assembly assembly) {
        if (activeProject == null || cadfile == null || assembly == null || assembly.getPersid() == null) {
            return;
        }

        String basePath = destination + activeProject.getUuid() + "/" + cadfile.getUuid() + "/";
        String persid = assembly.getPersid().replaceAll(":", "-");

        // Files to delete for an assembly
        String[] filesToDelete = {
            "out_" + persid + "_1.glb",
            "image_" + persid + "_1.png"
        };

        for (String filename : filesToDelete) {
            try {
                Path filePath = Paths.get(basePath + filename);
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    System.out.println("Deleted file: " + filePath);
                }
            } catch (IOException e) {
                System.out.println("Error deleting file " + filename + ": " + e.getMessage());
            }
        }
    }

    /**
     * Deletes the entire directory for a CADFile from the filesystem using UUID.
     */
    private void deleteCadFileDirectoryByUuid(String cadfileUuid) {
        if (activeProject == null || cadfileUuid == null) {
            return;
        }

        String dirPath = destination + activeProject.getUuid() + "/" + cadfileUuid;
        try {
            Path dir = Paths.get(dirPath);
            if (Files.exists(dir) && Files.isDirectory(dir)) {
                Files.walk(dir)
                    .sorted((a, b) -> b.compareTo(a)) // Reverse order to delete contents first
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                            System.out.println("Deleted: " + path);
                        } catch (IOException e) {
                            System.out.println("Error deleting " + path + ": " + e.getMessage());
                        }
                    });
                System.out.println("Deleted CADFile directory: " + dirPath);
            }
        } catch (IOException e) {
            System.out.println("Error deleting CADFile directory: " + e.getMessage());
        }
    }

    /**
     * Deletes part files using persid string.
     */
    private void deletePartFilesByPersid(String cadfileUuid, String persid) {
        if (activeProject == null || cadfileUuid == null || persid == null) {
            return;
        }

        String basePath = destination + activeProject.getUuid() + "/" + cadfileUuid + "/";
        String safePersid = persid.replaceAll(":", "-");

        String[] filesToDelete = {
            "out_" + safePersid + "_1.glb",
            "out_" + safePersid + "_1.step",
            "image_" + safePersid + "_1.png"
        };

        for (String filename : filesToDelete) {
            try {
                Path filePath = Paths.get(basePath + filename);
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    System.out.println("Deleted file: " + filePath);
                }
            } catch (IOException e) {
                System.out.println("Error deleting file " + filename + ": " + e.getMessage());
            }
        }

        // Delete simulation directory if exists
        String simDirPath = basePath + safePersid + "-cam_simulation";
        try {
            Path simDir = Paths.get(simDirPath);
            if (Files.exists(simDir) && Files.isDirectory(simDir)) {
                Files.walk(simDir)
                    .sorted((a, b) -> b.compareTo(a))
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                        } catch (IOException e) {
                            System.out.println("Error deleting " + path + ": " + e.getMessage());
                        }
                    });
                System.out.println("Deleted simulation directory: " + simDirPath);
            }
        } catch (IOException e) {
            System.out.println("Error deleting simulation directory: " + e.getMessage());
        }
    }

    /**
     * Counts the total number of elements (parts + assemblies) in an assembly recursively.
     * This includes all nested sub-assemblies and their parts.
     */
    public int getTotalElementCount(Assembly assembly) {
        if (assembly == null) {
            return 0;
        }
        int count = 0;

        // Count direct parts
        if (assembly.getParts() != null) {
            count += assembly.getParts().size();
        }

        // Count child assemblies and recurse into them
        if (assembly.getAssemblies() != null) {
            count += assembly.getAssemblies().size();
            for (Assembly child : assembly.getAssemblies()) {
                count += getTotalElementCount(child);
            }
        }

        return count;
    }

    /**
     * Gets/sets BOM view toggle state.
     */
    public boolean isBomViewActive() {
        // Don't show BOM view if there's no active project
        if (activeProject == null) {
            return false;
        }
        return bomViewActive;
    }

    public void setBomViewActive(boolean bomViewActive) {
        this.bomViewActive = bomViewActive;
    }

    public void toggleBomView() {
        this.bomViewActive = !this.bomViewActive;
    }

    /**
     * Returns the GLB URL for auto-loading the last uploaded part in the viewer.
     * Returns null if no recent upload or if the info has been cleared.
     */
    public String getLastUploadedGlbUrl() {
        if (lastUploadedCadfileUuid != null && lastUploadedPartPersid != null && activeProject != null) {
            return "glbserver?projectid=" + activeProject.getUuid() +
                   "&cadfile=" + lastUploadedCadfileUuid +
                   "&persid=" + lastUploadedPartPersid;
        }
        return null;
    }

    /**
     * Clears the last uploaded part info after it has been loaded in the viewer.
     */
    public void clearLastUploaded() {
        lastUploadedCadfileUuid = null;
        lastUploadedPartPersid = null;
    }

    public boolean getHasLastUploaded() {
        return lastUploadedCadfileUuid != null && lastUploadedPartPersid != null && activeProject != null;
    }

    /**
     * Gets consolidated BOM (Bill of Materials) from the assembly tree.
     * Parts are grouped by name and their quantities are summed.
     */
    public List<BOMItem> getBomItems() {
        List<BOMItem> bomItems = new ArrayList<>();

        if (activeProject == null) {
            return bomItems;
        }

        Map<String, BOMItem> bomMap = new HashMap<>();

        TreeNode<TreeNodeData> tree = getAssemblyTree();
        if (tree != null) {
            collectBomItems(tree, bomMap);
        }

        bomItems.addAll(bomMap.values());
        // Sort by name
        bomItems.sort((a, b) -> a.getName().compareToIgnoreCase(b.getName()));
        return bomItems;
    }

    private void collectBomItems(TreeNode<TreeNodeData> node, Map<String, BOMItem> bomMap) {
        TreeNodeData data = node.getData();
        if (data != null && "part".equals(data.getType())) {
            String key = data.getName() + "_" + (data.getPart() != null ? data.getPart().getId() : "");
            BOMItem existing = bomMap.get(key);
            if (existing != null) {
                existing.setTotalQuantity(existing.getTotalQuantity() + data.getQuantity());
            } else {
                BOMItem item = new BOMItem();
                item.setName(data.getName());
                item.setTotalQuantity(data.getQuantity());
                item.setShapeName(data.getShapeName());
                item.setPart(data.getPart());
                item.setCadfile(data.getCadfile());
                item.setQuoted(data.isQuoted());
                item.setMaterialName(data.getMaterialName());

                // Use manual price if set, otherwise use calculated unit cost
                if (data.getPart() != null) {
                    item.setThickness(data.getPart().getThickness());
                    if (data.getPart().getManualPrice() != null) {
                        item.setUnitCost(data.getPart().getManualPrice());
                        item.setQuoted(true); // Manual price means it's quoted
                    } else {
                        item.setUnitCost(data.getUnitCost());
                    }
                } else {
                    item.setUnitCost(data.getUnitCost());
                }

                bomMap.put(key, item);
            }
        }

        for (TreeNode<TreeNodeData> child : node.getChildren()) {
            collectBomItems(child, bomMap);
        }
    }

    /**
     * Saves the unit price for a BOM item and updates the part in the database.
     */
    public void saveBomItemPrice(BOMItem item) {
        if (item == null || item.getPart() == null) {
            return;
        }
        Part part = em.find(Part.class, item.getPart().getId());
        if (part != null) {
            part.setManualPrice(item.getUnitCost());
            System.out.println("Saved manual price for part " + item.getName() + ": " + item.getUnitCost());
            // Invalidate the cached tree to force recalculation
            cachedAssemblyTree = null;
        }
    }

    /**
     * BOM Item class for consolidated parts view.
     */
    public static class BOMItem {
        private String name;
        private int totalQuantity;
        private String shapeName;
        private BigDecimal unitCost;
        private BigDecimal thickness;
        private Part part;
        private CADFile cadfile;
        private boolean quoted;
        private String materialName;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public int getTotalQuantity() { return totalQuantity; }
        public void setTotalQuantity(int totalQuantity) { this.totalQuantity = totalQuantity; }

        public String getShapeName() { return shapeName; }
        public void setShapeName(String shapeName) { this.shapeName = shapeName; }

        public BigDecimal getUnitCost() { return unitCost; }
        public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }

        public BigDecimal getThickness() { return thickness; }
        public void setThickness(BigDecimal thickness) { this.thickness = thickness; }

        public Part getPart() { return part; }
        public void setPart(Part part) { this.part = part; }

        public CADFile getCadfile() { return cadfile; }
        public void setCadfile(CADFile cadfile) { this.cadfile = cadfile; }

        public boolean isQuoted() { return quoted; }
        public void setQuoted(boolean quoted) { this.quoted = quoted; }

        public BigDecimal getTotalCost() {
            if (unitCost == null) return BigDecimal.ZERO;
            return unitCost.multiply(BigDecimal.valueOf(totalQuantity));
        }

        public boolean isSheetMetal() {
            return shapeName != null && (shapeName.contains("Sheet") || shapeName.contains("Folded"));
        }

        public String getMaterialName() { return materialName; }
        public void setMaterialName(String materialName) { this.materialName = materialName; }
    }

    /**
     * Deletes assembly files using persid string.
     */
    private void deleteAssemblyFilesByPersid(String cadfileUuid, String persid) {
        if (activeProject == null || cadfileUuid == null || persid == null) {
            return;
        }

        String basePath = destination + activeProject.getUuid() + "/" + cadfileUuid + "/";
        String safePersid = persid.replaceAll(":", "-");

        String[] filesToDelete = {
            "out_" + safePersid + "_1.glb",
            "image_" + safePersid + "_1.png"
        };

        for (String filename : filesToDelete) {
            try {
                Path filePath = Paths.get(basePath + filename);
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    System.out.println("Deleted file: " + filePath);
                }
            } catch (IOException e) {
                System.out.println("Error deleting file " + filename + ": " + e.getMessage());
            }
        }
    }

    public static class TreeNodeData {
        private String name;
        private String type;
        private Part part;
        private Assembly assembly;
        private CADFile cadfile;
        private BigDecimal price;
        private int quantity;
        private boolean hasSimulation;
        private String simulationPath;
        private boolean foldedSheetMetal;

        // Cost fields for BOM integration
        private BigDecimal unitCost;
        private BigDecimal materialCost;
        private BigDecimal processingCost;
        private Product rawMaterial;
        private List<Product> availableMaterials;
        private Category selectedAlloy;
        private List<Category> availableAlloys;
        private boolean quoted;

        public TreeNodeData(String name, String type, Part part) {
            this.name = name;
            this.type = type;
            this.part = part;
            this.price = BigDecimal.ZERO;
            this.quantity = 1;
            this.hasSimulation = false;
            this.foldedSheetMetal = false;
            this.unitCost = BigDecimal.ZERO;
            this.materialCost = BigDecimal.ZERO;
            this.processingCost = BigDecimal.ZERO;
            this.availableMaterials = new ArrayList<>();
            this.quoted = false;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public Part getPart() { return part; }
        public void setPart(Part part) { this.part = part; }
        public Assembly getAssembly() { return assembly; }
        public void setAssembly(Assembly assembly) { this.assembly = assembly; }
        public CADFile getCadfile() { return cadfile; }
        public void setCadfile(CADFile cadfile) { this.cadfile = cadfile; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
        public boolean isHasSimulation() { return hasSimulation; }
        public void setHasSimulation(boolean hasSimulation) { this.hasSimulation = hasSimulation; }
        public String getSimulationPath() { return simulationPath; }
        public void setSimulationPath(String simulationPath) { this.simulationPath = simulationPath; }
        public boolean isFoldedSheetMetal() { return foldedSheetMetal; }
        public void setFoldedSheetMetal(boolean foldedSheetMetal) { this.foldedSheetMetal = foldedSheetMetal; }

        // Cost getters and setters
        public BigDecimal getUnitCost() { return unitCost; }
        public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
        public BigDecimal getMaterialCost() { return materialCost; }
        public void setMaterialCost(BigDecimal materialCost) { this.materialCost = materialCost; }
        public BigDecimal getProcessingCost() { return processingCost; }
        public void setProcessingCost(BigDecimal processingCost) { this.processingCost = processingCost; }
        public Product getRawMaterial() { return rawMaterial; }
        public void setRawMaterial(Product rawMaterial) { this.rawMaterial = rawMaterial; }
        public List<Product> getAvailableMaterials() { return availableMaterials; }
        public void setAvailableMaterials(List<Product> availableMaterials) { this.availableMaterials = availableMaterials; }
        public Category getSelectedAlloy() { return selectedAlloy; }
        public void setSelectedAlloy(Category selectedAlloy) { this.selectedAlloy = selectedAlloy; }
        public List<Category> getAvailableAlloys() { return availableAlloys; }
        public void setAvailableAlloys(List<Category> availableAlloys) { this.availableAlloys = availableAlloys; }
        public boolean isQuoted() { return quoted; }
        public void setQuoted(boolean quoted) { this.quoted = quoted; }

        // Computed properties
        public BigDecimal getTotalCost() {
            return unitCost.multiply(BigDecimal.valueOf(quantity));
        }

        public String getMaterialName() {
            if (rawMaterial != null) {
                return rawMaterial.getName();
            }
            return "Not selected";
        }

        public String getShapeName() {
            if (part != null && part.getShape() != null) {
                return part.getShape().getName();
            }
            if (assembly != null) {
                return "Assembly";
            }
            return "Unknown";
        }

        public String getShapeKey() {
            if (part != null && part.getShape() != null) {
                return part.getShape().getKey();
            }
            return null;
        }

        // Simulation feasibility methods
        public boolean isInfeasible() {
            return part != null && Boolean.TRUE.equals(part.getHasCollisions());
        }

        public boolean isHasManufacturingWarnings() {
            return part != null && Boolean.TRUE.equals(part.getHasWarnings());
        }

        public String getSimulationWarnings() {
            if (part != null && part.getSimulationWarnings() != null) {
                return part.getSimulationWarnings();
            }
            return null;
        }

        /**
         * Get a user-friendly status for the simulation.
         * Returns: "infeasible", "warnings", "ok", or null if not applicable
         */
        public String getSimulationStatus() {
            if (!foldedSheetMetal || !hasSimulation) {
                return null;
            }
            if (isInfeasible()) {
                return "infeasible";
            }
            if (isHasManufacturingWarnings()) {
                return "warnings";
            }
            return "ok";
        }
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

    /**
     * FlatTreeNode wraps TreeNodeData with depth and state info for custom HTML tree rendering.
     */
    public static class FlatTreeNode {
        private String nodeId;
        private TreeNodeData data;
        private int depth;
        private boolean hasChildren;
        private boolean expanded;
        private boolean visible;

        public FlatTreeNode(String nodeId, TreeNodeData data, int depth, boolean hasChildren) {
            this.nodeId = nodeId;
            this.data = data;
            this.depth = depth;
            this.hasChildren = hasChildren;
            this.expanded = true; // Default expanded
            this.visible = true;
        }

        public String getNodeId() { return nodeId; }
        public TreeNodeData getData() { return data; }
        public int getDepth() { return depth; }
        public boolean isHasChildren() { return hasChildren; }
        public boolean isExpanded() { return expanded; }
        public void setExpanded(boolean expanded) { this.expanded = expanded; }
        public boolean isVisible() { return visible; }
        public void setVisible(boolean visible) { this.visible = visible; }

        // Convenience getters that delegate to TreeNodeData
        public String getName() { return data.getName(); }
        public String getType() { return data.getType(); }
        public Part getPart() { return data.getPart(); }
        public Assembly getAssembly() { return data.getAssembly(); }
        public CADFile getCadfile() { return data.getCadfile(); }
        public int getQuantity() { return data.getQuantity(); }
        public boolean isFoldedSheetMetal() { return data.isFoldedSheetMetal(); }
        public boolean isHasSimulation() { return data.isHasSimulation(); }
        public String getSimulationPath() { return data.getSimulationPath(); }
        public BigDecimal getUnitCost() { return data.getUnitCost(); }
        public BigDecimal getTotalCost() { return data.getTotalCost(); }
        public boolean isQuoted() { return data.isQuoted(); }
        public String getShapeName() { return data.getShapeName(); }
        public String getShapeKey() { return data.getShapeKey(); }
        public String getMaterialName() { return data.getMaterialName(); }
        public Product getRawMaterial() { return data.getRawMaterial(); }
        public Category getSelectedAlloy() { return data.getSelectedAlloy(); }
        public void setSelectedAlloy(Category alloy) { data.setSelectedAlloy(alloy); }
        public List<Category> getAvailableAlloys() { return data.getAvailableAlloys(); }
        public boolean isInfeasible() { return data.isInfeasible(); }
        public boolean isHasManufacturingWarnings() { return data.isHasManufacturingWarnings(); }
        public String getSimulationWarnings() { return data.getSimulationWarnings(); }

        public int getIndentPx() { return depth * 20; }
    }

    /**
     * Get flat tree nodes for custom HTML tree rendering.
     */
    public List<FlatTreeNode> getFlatTreeNodes() {
        TreeNode<TreeNodeData> tree = getAssemblyTree();
        List<FlatTreeNode> result = new ArrayList<>();

        if (tree != null) {
            flattenTree(tree, result, -1, ""); // Start at -1 so root children are at depth 0
        }

        // Initialize expanded state - default all expanded
        if (expandedNodes.isEmpty() && !result.isEmpty()) {
            for (FlatTreeNode node : result) {
                if (node.isHasChildren()) {
                    expandedNodes.add(node.getNodeId());
                }
            }
        }

        // Update visibility and expanded state
        updateTreeVisibility(result);

        return result;
    }

    private void flattenTree(TreeNode<TreeNodeData> node, List<FlatTreeNode> result, int depth, String parentId) {
        TreeNodeData data = node.getData();

        // Skip the virtual root node (type "project")
        if (data != null && !"project".equals(data.getType())) {
            String nodeId = parentId + "_" + result.size();
            boolean hasChildren = !node.getChildren().isEmpty();
            FlatTreeNode flatNode = new FlatTreeNode(nodeId, data, depth, hasChildren);
            result.add(flatNode);

            for (TreeNode<TreeNodeData> child : node.getChildren()) {
                flattenTree(child, result, depth + 1, nodeId);
            }
        } else {
            // Process children of root node
            for (TreeNode<TreeNodeData> child : node.getChildren()) {
                flattenTree(child, result, depth + 1, parentId);
            }
        }
    }

    private void updateTreeVisibility(List<FlatTreeNode> nodes) {
        Set<String> visibleParents = new HashSet<>();

        for (FlatTreeNode node : nodes) {
            node.setExpanded(expandedNodes.contains(node.getNodeId()));

            // Root level nodes are always visible
            if (node.getDepth() == 0) {
                node.setVisible(true);
                if (node.isExpanded()) {
                    visibleParents.add(node.getNodeId());
                }
            } else {
                // Check if parent is visible and expanded
                String parentPrefix = node.getNodeId().substring(0, node.getNodeId().lastIndexOf('_'));
                boolean parentVisible = false;
                for (String vp : visibleParents) {
                    if (node.getNodeId().startsWith(vp)) {
                        parentVisible = true;
                        break;
                    }
                }
                node.setVisible(parentVisible);
                if (node.isVisible() && node.isExpanded() && node.isHasChildren()) {
                    visibleParents.add(node.getNodeId());
                }
            }
        }
    }

    /**
     * Toggle node expansion state.
     */
    public void toggleNode(String nodeId) {
        System.out.println("Toggle node called with: " + nodeId);
        if (expandedNodes.contains(nodeId)) {
            expandedNodes.remove(nodeId);
            System.out.println("Node collapsed: " + nodeId);
        } else {
            expandedNodes.add(nodeId);
            System.out.println("Node expanded: " + nodeId);
        }
    }

    /**
     * Delete a node from the flat tree (delegates to existing deleteNode logic).
     */
    public void deleteFlatNode(FlatTreeNode flatNode) {
        // Find the corresponding TreeNode and call existing delete
        TreeNode<TreeNodeData> tree = getAssemblyTree();
        TreeNode<TreeNodeData> nodeToDelete = findTreeNode(tree, flatNode.getData());
        if (nodeToDelete != null) {
            deleteNode(nodeToDelete.getData());
        }
    }

    private TreeNode<TreeNodeData> findTreeNode(TreeNode<TreeNodeData> root, TreeNodeData target) {
        if (root.getData() == target) {
            return root;
        }
        for (TreeNode<TreeNodeData> child : root.getChildren()) {
            TreeNode<TreeNodeData> found = findTreeNode(child, target);
            if (found != null) {
                return found;
            }
        }
        return null;
    }

    /**
     * Get all instances for a CADFile.
     */
    public List<Instance> getInstancesForCadFile(CADFile cadFile) {
        if (cadFile == null) {
            return new ArrayList<>();
        }
        return em.createQuery("SELECT i FROM Instance i WHERE i.cadfile = :cadfile", Instance.class)
                 .setParameter("cadfile", cadFile)
                 .getResultList();
    }

    /**
     * Get all instances for an assembly by its persid.
     * Returns instances whose part belongs to the assembly or its descendants.
     */
    public List<Instance> getInstancesForAssembly(String assemblyPersid, CADFile cadFile) {
        if (assemblyPersid == null || cadFile == null) {
            return new ArrayList<>();
        }

        // Get all instances for this CADFile
        List<Instance> allInstances = getInstancesForCadFile(cadFile);

        // Filter to instances whose persid starts with the assembly persid
        // (e.g., assembly "0-1" contains instances "0-1-0", "0-1-1", etc.)
        List<Instance> result = new ArrayList<>();
        for (Instance inst : allInstances) {
            if (inst.getPersid() != null && inst.getPersid().startsWith(assemblyPersid + "-")) {
                result.add(inst);
            }
        }

        return result;
    }

    /**
     * Get instances as JSON for the welding module.
     * Returns a list of instance data with part info and transforms.
     * The glbUrl is relative (needs context path prepended by the caller).
     */
    public String getInstancesJson(String assemblyPersid, String cadfileUuid) {
        if (activeProject == null || cadfileUuid == null) {
            return "[]";
        }

        // Find the CADFile
        CADFile cadFile = null;
        for (CADFile cf : activeProject.getCadfiles()) {
            if (cadfileUuid.equals(cf.getUuid())) {
                cadFile = cf;
                break;
            }
        }

        if (cadFile == null) {
            return "[]";
        }

        List<Instance> instances = (assemblyPersid != null)
            ? getInstancesForAssembly(assemblyPersid, cadFile)
            : getInstancesForCadFile(cadFile);

        System.out.println("getInstancesJson: Found " + instances.size() + " instances for assembly " + assemblyPersid);

        StringBuilder json = new StringBuilder("[");
        boolean first = true;
        int withPart = 0;
        int withoutPart = 0;

        for (Instance inst : instances) {
            if (!first) json.append(",");
            first = false;

            json.append("{");
            json.append("\"persid\":\"").append(escapeJson(inst.getPersid())).append("\",");

            if (inst.getPart() != null) {
                withPart++;
                json.append("\"partPersid\":\"").append(escapeJson(inst.getPart().getPersid())).append("\",");
                json.append("\"partName\":\"").append(escapeJson(inst.getPart().getName())).append("\",");
                // GLB URL - use part persid (glbserver serves one GLB per unique part)
                json.append("\"glbUrl\":\"glbserver?projectid=").append(activeProject.getUuid())
                    .append("&cadfile=").append(cadfileUuid)
                    .append("&persid=").append(inst.getPart().getPersid()).append("\",");
            } else {
                withoutPart++;
                System.out.println("  Instance " + inst.getPersid() + " has no Part!");
            }

            json.append("\"transform\":[");
            double[] t = inst.getTransformAsArray();
            for (int i = 0; i < 16; i++) {
                if (i > 0) json.append(",");
                json.append(t[i]);
            }
            json.append("],");

            json.append("\"hasTransform\":").append(inst.hasTransform());
            json.append("}");
        }

        json.append("]");
        System.out.println("getInstancesJson: " + withPart + " with Part, " + withoutPart + " without Part");
        return json.toString();
    }

    /**
     * Escape special characters for JSON string.
     */
    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    // Fields to hold welding request parameters (set via f:setPropertyActionListener)
    private String weldingAssemblyPersid;
    private String weldingCadfileUuid;

    public String getWeldingAssemblyPersid() { return weldingAssemblyPersid; }
    public void setWeldingAssemblyPersid(String weldingAssemblyPersid) { this.weldingAssemblyPersid = weldingAssemblyPersid; }

    public String getWeldingCadfileUuid() { return weldingCadfileUuid; }
    public void setWeldingCadfileUuid(String weldingCadfileUuid) { this.weldingCadfileUuid = weldingCadfileUuid; }

    /**
     * Action method for welding remoteCommand.
     * Returns instance data and weld interfaces via PrimeFaces callback parameters.
     */
    public void prepareWeldingData() {
        // Get parameters from request
        Map<String, String> params = FacesContext.getCurrentInstance()
            .getExternalContext().getRequestParameterMap();
        String assemblyPersid = params.get("assemblyPersid");
        String cadfileUuid = params.get("cadfileUuid");

        String instancesJson = getInstancesJson(assemblyPersid, cadfileUuid);
        org.primefaces.PrimeFaces.current().ajax().addCallbackParam("instances", instancesJson);

        // Read weld_interfaces JSON file
        String weldInterfacesJson = getWeldInterfacesJson(assemblyPersid, cadfileUuid);
        org.primefaces.PrimeFaces.current().ajax().addCallbackParam("weldInterfaces", weldInterfacesJson);

        System.out.println("Prepared welding data for assembly: " + assemblyPersid +
                          " cadfile: " + cadfileUuid);
    }

    /**
     * Read the weld_interfaces JSON file for an assembly.
     * @param assemblyPersid The assembly persid (e.g., "0-1-1-1")
     * @param cadfileUuid The CAD file UUID
     * @return The weld interfaces JSON string, or empty object if not found
     */
    private String getWeldInterfacesJson(String assemblyPersid, String cadfileUuid) {
        if (activeProject == null || assemblyPersid == null || cadfileUuid == null) {
            return "{}";
        }

        String projectUuid = activeProject.getUuid();
        String basePath = PathConfig.getProjectsPath() + projectUuid + "/" + cadfileUuid + "/";
        String fileName = "weld_interfaces_" + assemblyPersid + ".json";
        String filePath = basePath + fileName;

        java.io.File file = new java.io.File(filePath);
        if (!file.exists()) {
            System.out.println("Weld interfaces file not found: " + filePath);
            return "{}";
        }

        try {
            return new String(java.nio.file.Files.readAllBytes(file.toPath()), java.nio.charset.StandardCharsets.UTF_8);
        } catch (java.io.IOException e) {
            System.err.println("Error reading weld interfaces file: " + e.getMessage());
            return "{}";
        }
    }

}
