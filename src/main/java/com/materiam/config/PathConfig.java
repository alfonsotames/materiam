package com.materiam.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Centralized configuration for file system paths.
 * Loads settings from application.properties in the classpath.
 */
public class PathConfig {

    private static final Properties properties = new Properties();
    private static boolean loaded = false;

    static {
        loadProperties();
    }

    private static void loadProperties() {
        if (loaded) return;

        try (InputStream input = PathConfig.class.getClassLoader()
                .getResourceAsStream("application.properties")) {
            if (input != null) {
                properties.load(input);
                loaded = true;
            } else {
                System.err.println("Warning: application.properties not found in classpath");
            }
        } catch (IOException e) {
            System.err.println("Error loading application.properties: " + e.getMessage());
        }
    }

    /**
     * Gets the base path for project data files.
     * @return the projects path from configuration
     */
    public static String getProjectsPath() {
        return properties.getProperty("materiam.projects.path",
                "/home/mufufu/Downloads/materiam/data/projects/");
    }
}
