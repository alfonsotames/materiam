/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.materiam.controllers;

import org.primefaces.PrimeFaces;
import org.primefaces.event.FileUploadEvent;
import org.primefaces.event.FilesUploadEvent;
import org.primefaces.model.file.UploadedFile;
import org.primefaces.model.file.UploadedFiles;
import org.primefaces.util.EscapeUtils;

import jakarta.enterprise.context.RequestScoped;
import jakarta.faces.application.FacesMessage;
import jakarta.faces.context.FacesContext;
import jakarta.inject.Named;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import jakarta.json.JsonReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.StringReader;


import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;


import java.util.logging.Level;
import java.util.logging.Logger;



/**
 *
 * @author mufufu
 */
@Named(value = "fileUploadController")
@RequestScoped
public class FileUploadController {
        private String destination = "/tmp/alfonso/hola/";

        

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
            String command = String.format("asiSheetMetalExe %s %s/out.json -image %s/out/dump.png -asm -imagesForParts -gltf -flat -expandCompounds -onlyCuttingLines -gltfWithColors -step -profile -weldings", (destination + fileName), destination, destination);
            Process pr = rt.exec(command);

            
            
        } catch (IOException e) {
            System.out.println(e.getMessage());
        }
        
        try (JsonReader jsonReader = Json.createReader(new StringReader(Files.readString(Paths.get(destination+"out.json"))))) {

            JsonObject readObject = jsonReader.readObject();
            System.out.println(readObject.toString());
            
        }   catch (IOException ex) {
                System.getLogger(FileUploadController.class.getName()).log(System.Logger.Level.ERROR, (String) null, ex);
            }
        
    }
}
