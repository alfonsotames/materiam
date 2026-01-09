/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.controllers;

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
    
    public List<Instance> getInstances(Long cfid) {
        CADFile cf = em.find(CADFile.class, cfid);
        return cf.getInstances();
    }
    
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
    
    @Asynchronous
    public void testUpload(FileUploadEvent event) {
        
        System.out.println("Test upload for ..."+request.getSession().getId());
        //userController.sendUpdate("Importing file...");
       
        try {
            Runtime rt = Runtime.getRuntime();
            String command = String.format("/usr/local/bin/timer");
            System.out.println("* = - = * = - = Executing Timer * = - = * = - = *");
            Process pr = rt.exec(command);
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
    }

    // TODO: Make this method Asynchronous
    // Inform the user when the upload is complete so he can close the window
    // keep sending status messages   
    public void upload(FileUploadEvent event) {
        System.out.println("* - * - * * - * - * * - * - *  FileUpload Invoked * - * - *  * - * - * * - * - * ");
        FacesMessage msg = new FacesMessage("Success! ", event.getFile().getFileName() + " is uploaded.");
        FacesContext.getCurrentInstance().addMessage(null, msg);
        
        UploadedFile file = event.getFile();
        // Do what you want with the file
        userController.sendUpdate("Importing file...");
        
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
        f.setInstances(new ArrayList<Instance>());
        activeProject.getCadfiles().add(f);

        

        String filedest = destination.concat(getActiveProject().getUuid()+"/"+f.getUuid()+"/");
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
            //String command = String.format("asiSheetMetalExe %s %s/out.json  -asm  -flat -expandCompounds  -profile ", (filedest + fileName), filedest, filedest);
            // asiSheetMetalExe parrilla.step out.json -image ./ -asm -imagesForParts -gltf -flat -expandCompounds -onlyCuttingLines -gltfWithColors -step -profile
            Process pr = rt.exec(command);
            userController.sendUpdate("Reading STEP file...");
            try {
                BufferedReader reader = new BufferedReader(new InputStreamReader(pr.getInputStream()));
                String line;
                System.out.println("Process Output:");
                while ((line = reader.readLine()) != null) {
                    
                    System.out.println(line);
                    if (line.startsWith("******") || line.contains("info")) {
                        userController.sendUpdate(line);
                    }
                }
                pr.waitFor();
            } catch (InterruptedException ex) {
                System.getLogger(ProjectController.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
            }

        } catch (IOException e) {
            System.out.println(e.getMessage());
        }
        
        try {
            Runtime rt = Runtime.getRuntime();
            String command = String.format("stepguru %s --outdir %s", (filedest + fileName), filedest);
            System.out.println("* = - = * = - = * = - = * = - = * = - = * = - = * = - = * = - = * = - = * = - = * = - = Executing stepguru * = - = * = - = * = - = * = - = * = - = * = - = * = - = * = - = * = - = ");
            System.out.println("Executing stepguru: "+command);
            Process pr = rt.exec(command);
            userController.sendUpdate("Generating files...");

            BufferedReader reader = new BufferedReader(new InputStreamReader(pr.getInputStream()));
            String line;
            System.out.println("Process Output:");
            while ((line = reader.readLine()) != null) {

                System.out.println(line);
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

            
            
        try {
            Runtime rt = Runtime.getRuntime();
            String command = String.format("mogrify %s*.png -transparent white %s*.png",filedest, filedest);
            System.out.println("* = - = * = - = * = - = * = - = * = - = * = - = * = - = * = - = * = - = * = - = * = - = Executing mogrify * = - = * = - = * = - = * = - = * = - = * = - = * = - = * = - = * = - = ");
            System.out.println("Executing mogrify: "+command);
            Process pr = rt.exec(command);
            BufferedReader reader = new BufferedReader(new InputStreamReader(pr.getInputStream()));
            String line;
            //System.out.println("Process Output:");
            while ((line = reader.readLine()) != null) {
                //System.out.println(line);
                userController.sendUpdate(line);
            }
            pr.waitFor();
            } catch (InterruptedException ex) {
                System.getLogger(ProjectController.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
            } catch (IOException ex) {
            System.getLogger(ProjectController.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
        }
        

        
        
        
        try (JsonReader jsonReader = Json.createReader(new StringReader(Files.readString(Paths.get(filedest+"out.json"))))) {

            JsonObject json = jsonReader.readObject();
            //System.out.println("JsonObject toString output:");
            //System.out.println(json.toString());

            // The STEP file has an array of parts and each part has an array of bodies

            // Get the "parts" array
            JsonArray parts = json.getJsonArray("parts");

            // Iterate through each part object
            Map<String, Part> partmap = new HashMap<String, Part>();
            
            for (JsonObject p : parts.getValuesAs(JsonObject.class)) {
                
                JsonArray bodies = p.getJsonArray("bodies");
                
                for (JsonObject b : bodies.getValuesAs(JsonObject.class)) {
                    
                    // If the part 
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
                    
                    
                    //MaterialFormat pt = (MaterialFormat)em.createQuery("select mf from MaterialFormat mf where mf.type=:type").setParameter("type", type).getSingleResult();
                    
                    Category shape = (Category)em.createQuery("select cat from Category cat where cat.key=:type").setParameter("type",type).getSingleResult();
                    part.setShape(shape);
                    // TODO: Define routing and BOM data structures
                    /*
                    If it indeed is a Sheet Metal part, then we can define the manufacturing process.
                    This will help in our manufacturing application. We need to define basic routing
                    (1. laser cut, 2. bending) then the client defines material (BOM) and finishes
                    (additional routing stops).
                    */
                    
                    
                  
                    
                    
                    if (type.equals("SHEET_METAL_FOLDED") || type.equals("SHEET_METAL_FLAT")) {
                        if (type.equals("SHEET_METAL_FOLDED")) {
                            JsonArray bends = b.getJsonArray("bends");
                            part.setBends((long)bends.size());
                        }
                        part.setFlatObbWidth(b.getJsonNumber("flatAabbWidth").bigDecimalValue());
                        part.setFlatObbLength(b.getJsonNumber("flatAabbLength").bigDecimalValue());
                        part.setThickness(b.getJsonNumber("thickness").bigDecimalValue());
                        part.setFlatTotalContourLength(b.getJsonNumber("flatTotalContourLength").bigDecimalValue());
                        part.setVolume(b.getJsonNumber("volume").bigDecimalValue());
                        part.setTotalArea(b.getJsonNumber("totalArea").bigDecimalValue());
                        
                        //Material m = (Material)em.createQuery("select m from Material m order by abs(m.thickness - :thickness)").setParameter("thickness", b.getJsonNumber("thickness").bigDecimalValue()).setMaxResults(1).getSingleResult();
                        //part.setMaterial(m);
                        
                        Product m = (Product)em.createQuery("select p from Product p, Property t, Category shape "
                                + "where t.product=p and t.propertyType.key='THICKNESS' and shape.key='SHEET_METAL_FLAT' and p.categories=shape order by abs(t.value - :thickness)")
                                .setParameter("thickness", b.getJsonNumber("thickness").bigDecimalValue()).setMaxResults(1).getSingleResult();
                        part.setMaterial(m);
                        
                        // save
                        f.getParts().add(part);
                        partmap.put(p.getString("id"), part);                     
                        

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
                        
                        System.out.println(" ******************************************************************************************************************** ");
                        System.out.println(" ************************ LOOKING FOR THE BEST FIT OF TUBE RECTANGUAR *********************************************** ");
                        System.out.println("Tube Size (w,h): "+b.getJsonNumber("sectionWidth").bigDecimalValue()+","+b.getJsonNumber("sectionHeight").bigDecimalValue());
                        System.out.println("Tube Length: "+b.getJsonNumber("partLength").bigDecimalValue());
                        System.out.println("Tube Thickness: "+b.getJsonNumber("thickness").bigDecimalValue());
                        
                        BigDecimal x = b.getJsonNumber("sectionWidth").bigDecimalValue();
                        BigDecimal y = b.getJsonNumber("sectionHeight").bigDecimalValue();
                        
                        BigDecimal width;
                        BigDecimal height;
                        
                        if (x.compareTo(y) > 0) {
                            width=x;
                            height=y;
                        } else {
                            width=y;
                            height=x;
                        }
                        
                        /*        -------------------- TEST ---------------------    */
                        List<Product> testp = em.createQuery("select p from Product p, Category shape, Property w, Property h, Property t "
                                + "where shape.key='TUBE_RECTANGULAR' and shape.products=p and "
                                + "w.propertyType.key='WIDTH'     and w.product=p and "
                                + "h.propertyType.key='HEIGHT'    and h.product=p and "
                                + "t.propertyType.key='THICKNESS' and t.product=p order by "
                                + "abs(w.value - :width), "
                                + "abs(h.value - :height), "
                                + "abs(t.value - :thickness)")
                                .setParameter("width", width.setScale(2, RoundingMode.HALF_UP))
                                .setParameter("height", height.setScale(2, RoundingMode.HALF_UP))
                                .setParameter("thickness", b.getJsonNumber("thickness").bigDecimalValue().setScale(2, RoundingMode.HALF_UP))
                                .getResultList();
                        for (Product tp : testp) {
                            System.out.println("Product: "+tp.getName());
                        }
                        System.out.println(" ******************************************************************************************************************** ");
                        
                        /* --------------------------------------------------------- */
                        
                        Query q = em.createQuery("select p from Product p, Category shape, Property w, Property h, Property t "
                                + "where shape.key='TUBE_RECTANGULAR' and shape.products=p and "
                                + "w.propertyType.key='WIDTH'     and w.product=p and "
                                + "h.propertyType.key='HEIGHT'    and h.product=p and "
                                + "t.propertyType.key='THICKNESS' and t.product=p order by "
                                + "abs(w.value - :width), "
                                + "abs(h.value - :height), "
                                + "abs(t.value - :thickness)")
                                .setParameter("width", width.setScale(2, RoundingMode.HALF_UP))
                                .setParameter("height", height.setScale(2, RoundingMode.HALF_UP))
                                .setParameter("thickness", b.getJsonNumber("thickness").bigDecimalValue().setScale(2, RoundingMode.HALF_UP));
                        
                        
                        System.out.println("Query: "+q.toString());
                        
                        Product m = (Product)q.setMaxResults(1).getSingleResult();
                        part.setMaterial(m);
                        
                        
                        // save
                        f.getParts().add(part);
                        partmap.put(p.getString("id"), part);
                        
                    }
                    /*
                    if (bodies.size() == 1) {
                                            // save
                        f.getParts().add(part);
                        partmap.put(p.getString("id"), part);    
                    }
                    */
                                        
                }
            }

            
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
                
                
                JsonString persid = pps.get(inst.getJsonNumber("prototype"));

                if (persid != null) {
                    System.out.println("Finding persid: "+persid+" inside the part map");

                    
                    Part part = partmap.get(persid.getString());
                    if (part != null) {
                        System.out.println("Found part "+part.getPersid());
                        System.out.println("The part found has id: "+part.getId());
                        Instance instance = new Instance();
                        instance.setPart(part);

                        instance.setRotx(rotation.getJsonNumber(0).bigDecimalValue());
                        instance.setTransx(translation.getJsonNumber(0).bigDecimalValue());
                        instance.setCadfile(f);
                        f.getInstances().add(instance);
                        System.out.println("* * * * * * * * * ADDING INSTANCE * * * * * * "+instance.getPart()+" rotx: "+instance.getRotx()+" now contains:"+f.getInstances().size());
                        
                        
                    }
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
