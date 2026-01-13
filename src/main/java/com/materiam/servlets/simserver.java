/*
 * Servlet to serve simulation files (blueprint.json, simulation.json, tools.glb)
 * URL pattern: /simserver/{projectUuid}/{cadfileUuid}/{partPersid}/{filename}
 */
package com.materiam.servlets;

import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;

/**
 * Serves simulation files for the CAD viewer
 * @author mufufu
 */
@WebServlet(name = "simserver", urlPatterns = {"/simserver/*"})
public class simserver extends HttpServlet {

    private static final String BASE_PATH = "/Users/mufufu/Downloads/materiam/data/projects/";
    private static final String TOOLS_PATH = "/usr/local/share/amatix/tools/";

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = request.getPathInfo();

        if (pathInfo == null || pathInfo.length() < 2) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing path");
            return;
        }

        // Remove leading slash
        pathInfo = pathInfo.substring(1);

        // Sanitize path to prevent directory traversal
        pathInfo = pathInfo.replaceAll("\\.\\.", "").replaceAll("//", "/");

        String filename;
        String contentType;

        // Construct path: BASE_PATH + pathInfo
        filename = BASE_PATH + pathInfo;

        // Set content type based on file extension
        if (filename.endsWith(".json")) {
            contentType = "application/json";
        } else if (filename.endsWith(".glb")) {
            contentType = "model/gltf-binary";
        } else {
            contentType = "application/octet-stream";
        }

        File file = new File(filename);

        // Fallback for tools.glb: check global location if not found in simulation dir
        if (!file.exists() && (pathInfo.equals("tools.glb") || pathInfo.endsWith("/tools.glb"))) {
            filename = TOOLS_PATH + "tools.glb";
            file = new File(filename);
        }
        if (!file.exists()) {
            resp.sendError(HttpServletResponse.SC_NOT_FOUND, "File not found");
            return;
        }

        // Allow CORS for local development
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setContentType(contentType);
        resp.setContentLength((int) file.length());

        try (FileInputStream in = new FileInputStream(file);
             OutputStream out = resp.getOutputStream()) {
            byte[] buf = new byte[4096];
            int count;
            while ((count = in.read(buf)) >= 0) {
                out.write(buf, 0, count);
            }
        }
    }

    @Override
    public String getServletInfo() {
        return "Simulation file server for CAD viewer";
    }
}
