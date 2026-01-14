package com.materiam.controllers;

import com.materiam.controllers.ProjectController.TreeNodeData;
import com.materiam.entities.Category;
import com.materiam.entities.Part;
import com.materiam.entities.Product;
import com.materiam.entities.Property;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.SessionScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import org.primefaces.model.TreeNode;

/**
 * Quoting Engine for calculating material requirements and costs for parts.
 * Matches parts to appropriate raw materials based on shape and dimensions.
 * Integrates with the assembly tree to show costs hierarchically.
 */
@Named
@SessionScoped
public class QuotingEngine implements Serializable {

    private static final long serialVersionUID = 1L;

    @PersistenceContext
    private EntityManager em;

    @Inject
    private ProjectController projectController;

    private BigDecimal totalMaterialCost;
    private BigDecimal totalProcessingCost;
    private BigDecimal totalCost;
    private boolean quotesGenerated;
    private List<Category> alloys;

    @PostConstruct
    public void init() {
        totalMaterialCost = BigDecimal.ZERO;
        totalProcessingCost = BigDecimal.ZERO;
        totalCost = BigDecimal.ZERO;
        quotesGenerated = false;
    }

    /**
     * Generate quotes for all parts in the assembly tree.
     * Calculates costs for parts and aggregates them up to assemblies.
     */
    @Transactional
    public void generateQuotes() {
        totalMaterialCost = BigDecimal.ZERO;
        totalProcessingCost = BigDecimal.ZERO;
        totalCost = BigDecimal.ZERO;

        TreeNode<TreeNodeData> tree = projectController.getAssemblyTree();
        if (tree == null) {
            return;
        }

        // Process the tree - calculate costs for parts and aggregate to assemblies
        processTreeNode(tree);

        quotesGenerated = true;
    }

    /**
     * Process quotes for a given tree (called by ProjectController after building tree).
     * This avoids circular dependency issues.
     */
    @Transactional
    public void processTree(TreeNode<TreeNodeData> tree) {
        totalMaterialCost = BigDecimal.ZERO;
        totalProcessingCost = BigDecimal.ZERO;
        totalCost = BigDecimal.ZERO;

        if (tree == null) {
            return;
        }

        // Process the tree - calculate costs for parts and aggregate to assemblies
        processTreeNode(tree);

        quotesGenerated = true;
    }

    /**
     * Recursively process tree nodes, calculating costs for parts
     * and aggregating costs for assemblies.
     */
    private BigDecimal processTreeNode(TreeNode<TreeNodeData> node) {
        TreeNodeData data = node.getData();
        BigDecimal nodeTotalCost = BigDecimal.ZERO;

        if (node.getChildren() != null && !node.getChildren().isEmpty()) {
            // This is an assembly or project node - aggregate children costs
            for (TreeNode<TreeNodeData> child : node.getChildren()) {
                nodeTotalCost = nodeTotalCost.add(processTreeNode(child));
            }

            if (data != null) {
                data.setUnitCost(nodeTotalCost);
                data.setQuoted(true);
            }
        } else if (data != null && "part".equals(data.getType())) {
            // This is a part node - calculate its cost only for quotable shapes
            Part part = data.getPart();
            if (part != null && part.getShape() != null && isQuotableShape(part.getShape().getKey())) {
                matchRawMaterial(data);
                calculateCosts(data);
                data.setQuoted(true);

                nodeTotalCost = data.getTotalCost();
                totalMaterialCost = totalMaterialCost.add(data.getMaterialCost().multiply(BigDecimal.valueOf(data.getQuantity())));
                totalProcessingCost = totalProcessingCost.add(data.getProcessingCost().multiply(BigDecimal.valueOf(data.getQuantity())));
            }
            // UNKNOWN and UNRECOGNIZED parts are skipped - not quoted
        }

        totalCost = totalMaterialCost.add(totalProcessingCost);
        return nodeTotalCost;
    }

    /**
     * Match a part to the most appropriate raw material based on shape and dimensions.
     */
    private void matchRawMaterial(TreeNodeData nodeData) {
        Part part = nodeData.getPart();
        if (part == null || part.getShape() == null) {
            return;
        }

        String shapeKey = part.getShape().getKey();

        // Get available alloys for this shape
        String materialShapeKey = getMaterialShapeKey(shapeKey);
        List<Category> availableAlloys = getAvailableAlloysForShape(materialShapeKey);
        nodeData.setAvailableAlloys(availableAlloys);

        List<Product> candidates = new ArrayList<>();

        switch (shapeKey) {
            case "SHEET_METAL_FLAT":
            case "SHEET_METAL_FOLDED":
                candidates = findSheetMetalMaterials(part);
                break;
            case "TUBE_RECTANGULAR":
                candidates = findRectangularTubeMaterials(part);
                break;
            case "TUBE_ROUND":
                candidates = findRoundTubeMaterials(part);
                break;
            case "BAR_ROUND":
                candidates = findRoundBarMaterials(part);
                break;
            default:
                // Try generic matching by shape
                candidates = findMaterialsByShape(shapeKey, part);
                break;
        }

        if (!candidates.isEmpty()) {
            Product material = candidates.get(0);
            nodeData.setRawMaterial(material);
            nodeData.setAvailableMaterials(candidates);

            // Set the selected alloy from the material's categories
            Category alloy = extractAlloyFromProduct(material);
            if (alloy != null) {
                nodeData.setSelectedAlloy(alloy);
            }
        }
    }

    /**
     * Extract the alloy category from a product's categories.
     */
    private Category extractAlloyFromProduct(Product product) {
        if (product == null || product.getCategories() == null) {
            return null;
        }
        for (Category cat : product.getCategories()) {
            if (cat.getParent() != null && "ALLOY".equals(cat.getParent().getKey())) {
                return cat;
            }
        }
        return null;
    }

    /**
     * Find sheet metal materials that can accommodate the part's flat pattern.
     */
    private List<Product> findSheetMetalMaterials(Part part) {
        BigDecimal thickness = part.getThickness();
        if (thickness == null) {
            thickness = BigDecimal.ONE;
        }

        // Use flat pattern dimensions if available, otherwise use dimX/dimY
        BigDecimal width = part.getFlatObbWidth();
        BigDecimal length = part.getFlatObbLength();

        if (width == null || width.compareTo(BigDecimal.ZERO) == 0) {
            width = part.getDimX();
        }
        if (length == null || length.compareTo(BigDecimal.ZERO) == 0) {
            length = part.getDimY();
        }

        if (width == null) width = BigDecimal.ZERO;
        if (length == null) length = BigDecimal.ZERO;

        // Ensure width <= length for consistent matching
        if (width.compareTo(length) > 0) {
            BigDecimal temp = width;
            width = length;
            length = temp;
        }

        try {
            return em.createQuery(
                "SELECT p FROM Product p " +
                "JOIN p.categories shape " +
                "JOIN p.properties w " +
                "JOIN p.properties l " +
                "JOIN p.properties t " +
                "JOIN w.propertyType wt " +
                "JOIN l.propertyType lt " +
                "JOIN t.propertyType tt " +
                "WHERE (shape.key = 'SHEET_METAL_FLAT' OR shape.key = 'SHEET_METAL_FOLDED') " +
                "AND wt.key = 'WIDTH' AND w.value >= :width " +
                "AND lt.key = 'LENGTH' AND l.value >= :length " +
                "AND tt.key = 'THICKNESS' AND t.value = :thickness " +
                "ORDER BY w.value ASC, l.value ASC", Product.class)
                .setParameter("width", width.setScale(2, RoundingMode.HALF_UP))
                .setParameter("length", length.setScale(2, RoundingMode.HALF_UP))
                .setParameter("thickness", thickness.setScale(2, RoundingMode.HALF_UP))
                .setMaxResults(10)
                .getResultList();
        } catch (Exception e) {
            System.err.println("Error finding sheet metal materials: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Find rectangular tube materials matching the part's cross-section.
     */
    private List<Product> findRectangularTubeMaterials(Part part) {
        BigDecimal width = part.getSectionWidth();
        BigDecimal height = part.getSectionHeight();
        BigDecimal thickness = part.getThickness();

        if (width == null) width = BigDecimal.ZERO;
        if (height == null) height = BigDecimal.ZERO;
        if (thickness == null) thickness = BigDecimal.ONE;

        // Ensure width >= height for consistent matching
        if (width.compareTo(height) < 0) {
            BigDecimal temp = width;
            width = height;
            height = temp;
        }

        final BigDecimal targetWidth = width;
        final BigDecimal targetHeight = height;
        final BigDecimal targetThickness = thickness;

        System.out.println("findRectangularTubeMaterials: width=" + width + ", height=" + height + ", thickness=" + thickness);

        try {
            List<Product> results = em.createQuery(
                "SELECT DISTINCT p FROM Product p " +
                "JOIN p.categories shape " +
                "WHERE shape.key = 'TUBE_RECTANGULAR'", Product.class)
                .getResultList();

            System.out.println("Found " + results.size() + " rectangular tube materials");

            // Sort by closest dimension match (try both orientations)
            results.sort((p1, p2) -> {
                BigDecimal diff1 = calculateTubeDimensionDiff(p1, targetWidth, targetHeight, targetThickness);
                BigDecimal diff2 = calculateTubeDimensionDiff(p2, targetWidth, targetHeight, targetThickness);
                return diff1.compareTo(diff2);
            });

            if (results.size() > 10) {
                results = results.subList(0, 10);
            }

            if (!results.isEmpty()) {
                Product best = results.get(0);
                System.out.println("Best match: " + best.getName() +
                    " (W=" + getPropertyValue(best, "WIDTH") +
                    ", H=" + getPropertyValue(best, "HEIGHT") +
                    ", T=" + getPropertyValue(best, "THICKNESS") + ")");
            }

            return results;
        } catch (Exception e) {
            System.err.println("Error finding rectangular tube materials: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    /**
     * Find round tube materials matching the part's diameter.
     */
    private List<Product> findRoundTubeMaterials(Part part) {
        BigDecimal diameter = part.getDiameter();
        BigDecimal thickness = part.getThickness();

        if (diameter == null) diameter = BigDecimal.ZERO;
        if (thickness == null) thickness = BigDecimal.ONE;

        try {
            return em.createQuery(
                "SELECT p FROM Product p " +
                "JOIN p.categories shape " +
                "JOIN p.properties d " +
                "JOIN p.properties t " +
                "JOIN d.propertyType dt " +
                "JOIN t.propertyType tt " +
                "WHERE shape.key = 'TUBE_ROUND' " +
                "AND dt.key = 'DIAMETER' " +
                "AND tt.key = 'THICKNESS' " +
                "ORDER BY ABS(d.value - :diameter), ABS(t.value - :thickness)", Product.class)
                .setParameter("diameter", diameter.setScale(2, RoundingMode.HALF_UP))
                .setParameter("thickness", thickness.setScale(2, RoundingMode.HALF_UP))
                .setMaxResults(10)
                .getResultList();
        } catch (Exception e) {
            System.err.println("Error finding round tube materials: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Find round bar materials matching the part's diameter.
     */
    private List<Product> findRoundBarMaterials(Part part) {
        BigDecimal diameter = part.getDiameter();

        if (diameter == null) diameter = BigDecimal.ZERO;

        try {
            return em.createQuery(
                "SELECT p FROM Product p " +
                "JOIN p.categories shape " +
                "JOIN p.properties d " +
                "JOIN d.propertyType dt " +
                "WHERE shape.key = 'BAR_ROUND' " +
                "AND dt.key = 'DIAMETER' " +
                "ORDER BY ABS(d.value - :diameter)", Product.class)
                .setParameter("diameter", diameter.setScale(2, RoundingMode.HALF_UP))
                .setMaxResults(10)
                .getResultList();
        } catch (Exception e) {
            System.err.println("Error finding round bar materials: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Generic material matching by shape category.
     */
    private List<Product> findMaterialsByShape(String shapeKey, Part part) {
        try {
            return em.createQuery(
                "SELECT p FROM Product p " +
                "JOIN p.categories shape " +
                "WHERE shape.key = :shapeKey", Product.class)
                .setParameter("shapeKey", shapeKey)
                .setMaxResults(10)
                .getResultList();
        } catch (Exception e) {
            System.err.println("Error finding materials by shape: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Calculate material and processing costs for a tree node data.
     */
    private void calculateCosts(TreeNodeData nodeData) {
        Part part = nodeData.getPart();
        Product material = nodeData.getRawMaterial();

        if (part == null) {
            nodeData.setMaterialCost(BigDecimal.ZERO);
            nodeData.setProcessingCost(BigDecimal.ZERO);
            nodeData.setUnitCost(BigDecimal.ZERO);
            return;
        }

        BigDecimal materialCost = BigDecimal.ZERO;
        BigDecimal processingCost = BigDecimal.ZERO;

        if (material != null) {
            // Get material properties
            BigDecimal density = getPropertyValue(material, "DENSITY");
            BigDecimal pricePerKg = getPropertyValue(material, "PRICEPERKG");

            if (density == null) density = new BigDecimal("7850"); // Steel default kg/m³
            if (pricePerKg == null) pricePerKg = BigDecimal.ONE;

            // Calculate volume in m³
            BigDecimal volumeMm3 = part.getVolume();
            if (volumeMm3 == null || volumeMm3.compareTo(BigDecimal.ZERO) == 0) {
                // Estimate volume from dimensions
                volumeMm3 = estimateVolume(part);
            }

            // Convert mm³ to m³ (divide by 1,000,000,000)
            BigDecimal volumeM3 = volumeMm3.divide(new BigDecimal("1000000000"), 10, RoundingMode.HALF_UP);

            // Calculate weight in kg
            BigDecimal weightKg = volumeM3.multiply(density);

            // Calculate material cost
            materialCost = weightKg.multiply(pricePerKg).setScale(2, RoundingMode.HALF_UP);
        }

        // Calculate processing costs based on shape
        if (part.getShape() != null) {
            String shapeKey = part.getShape().getKey();
            processingCost = calculateProcessingCost(part, shapeKey);
        }

        nodeData.setMaterialCost(materialCost);
        nodeData.setProcessingCost(processingCost);
        nodeData.setUnitCost(materialCost.add(processingCost));
    }

    private BigDecimal estimateVolume(Part part) {
        BigDecimal dimX = part.getDimX();
        BigDecimal dimY = part.getDimY();
        BigDecimal dimZ = part.getDimZ();

        if (dimX == null) dimX = BigDecimal.ZERO;
        if (dimY == null) dimY = BigDecimal.ZERO;
        if (dimZ == null) dimZ = BigDecimal.ZERO;

        // Simple bounding box volume (actual volume would be less for complex shapes)
        return dimX.multiply(dimY).multiply(dimZ).multiply(new BigDecimal("0.5")); // 50% fill factor
    }

    private BigDecimal calculateProcessingCost(Part part, String shapeKey) {
        BigDecimal cost = BigDecimal.ZERO;

        switch (shapeKey) {
            case "SHEET_METAL_FLAT":
            case "SHEET_METAL_FOLDED":
                // Laser cutting cost
                BigDecimal contourLength = part.getFlatTotalContourLength();
                if (contourLength != null && contourLength.compareTo(BigDecimal.ZERO) > 0) {
                    // Cutting speed: 28.5 mm/sec (hardcoded for now)
                    BigDecimal cuttingSpeedMmSec = new BigDecimal("28.5");
                    BigDecimal cuttingTimeHours = contourLength.divide(cuttingSpeedMmSec, 6, RoundingMode.HALF_UP)
                            .divide(new BigDecimal("3600"), 6, RoundingMode.HALF_UP);

                    // Laser cutting rate: $150/hour (should come from FabProcess)
                    BigDecimal hourlyRate = new BigDecimal("150");
                    cost = cost.add(cuttingTimeHours.multiply(hourlyRate));
                }

                // Bending cost for folded sheet metal
                if ("SHEET_METAL_FOLDED".equals(shapeKey) && part.getBends() != null && part.getBends() > 0) {
                    // Press brake rate: $120/hour, ~10 bends per minute
                    BigDecimal bendCost = new BigDecimal("0.20"); // $0.20 per bend
                    cost = cost.add(bendCost.multiply(BigDecimal.valueOf(part.getBends())));
                }
                break;

            case "TUBE_RECTANGULAR":
            case "TUBE_ROUND":
            case "BAR_ROUND":
                // Sawing cost based on cross-section
                BigDecimal sawingCost = new BigDecimal("2.00"); // Base sawing cost
                cost = cost.add(sawingCost);
                break;
        }

        return cost.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal getPropertyValue(Product product, String propertyKey) {
        if (product == null || product.getProperties() == null) {
            return null;
        }
        for (Property prop : product.getProperties()) {
            if (prop.getPropertyType() != null && propertyKey.equals(prop.getPropertyType().getKey())) {
                return prop.getValue();
            }
        }
        return null;
    }

    /**
     * Update the raw material for a tree node and recalculate costs.
     */
    @Transactional
    public void updateMaterial(TreeNodeData nodeData, Product newMaterial) {
        nodeData.setRawMaterial(newMaterial);
        calculateCosts(nodeData);
        recalculateTotals();
    }

    /**
     * Update the quantity for a tree node and recalculate costs.
     */
    public void updateQuantity(TreeNodeData nodeData, int newQuantity) {
        nodeData.setQuantity(newQuantity);
        recalculateTotals();
    }

    /**
     * Recalculate totals by traversing the tree.
     */
    private void recalculateTotals() {
        totalMaterialCost = BigDecimal.ZERO;
        totalProcessingCost = BigDecimal.ZERO;

        TreeNode<TreeNodeData> tree = projectController.getAssemblyTree();
        if (tree != null) {
            recalculateNodeTotals(tree);
        }

        totalCost = totalMaterialCost.add(totalProcessingCost);
    }

    private BigDecimal recalculateNodeTotals(TreeNode<TreeNodeData> node) {
        TreeNodeData data = node.getData();
        BigDecimal nodeTotalCost = BigDecimal.ZERO;

        if (node.getChildren() != null && !node.getChildren().isEmpty()) {
            // Assembly - aggregate children costs
            for (TreeNode<TreeNodeData> child : node.getChildren()) {
                nodeTotalCost = nodeTotalCost.add(recalculateNodeTotals(child));
            }
            if (data != null) {
                data.setUnitCost(nodeTotalCost);
            }
        } else if (data != null && "part".equals(data.getType())) {
            // Part - use its existing calculated costs
            nodeTotalCost = data.getTotalCost();
            totalMaterialCost = totalMaterialCost.add(data.getMaterialCost().multiply(BigDecimal.valueOf(data.getQuantity())));
            totalProcessingCost = totalProcessingCost.add(data.getProcessingCost().multiply(BigDecimal.valueOf(data.getQuantity())));
        }

        return nodeTotalCost;
    }

    /**
     * Check if a shape is quotable (not UNKNOWN or UNRECOGNIZED).
     */
    private boolean isQuotableShape(String shapeKey) {
        if (shapeKey == null) {
            return false;
        }
        switch (shapeKey) {
            case "SHEET_METAL_FLAT":
            case "SHEET_METAL_FOLDED":
            case "TUBE_RECTANGULAR":
            case "TUBE_ROUND":
            case "BENT_TUBE_RECTANGULAR":
            case "BENT_TUBE_ROUND":
            case "BAR_ROUND":
            case "BAR_RECTANGULAR":
                return true;
            default:
                // UNKNOWN, UNRECOGNIZED, etc. are not quotable
                return false;
        }
    }

    // Getters

    public BigDecimal getTotalMaterialCost() {
        return totalMaterialCost;
    }

    public BigDecimal getTotalProcessingCost() {
        return totalProcessingCost;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public boolean isQuotesGenerated() {
        return quotesGenerated;
    }

    /**
     * Get all available alloys for material selection.
     */
    public List<Category> getAlloys() {
        if (alloys == null) {
            alloys = em.createQuery("SELECT a FROM Category a WHERE a.parent.key = 'ALLOY' ORDER BY a.name", Category.class)
                    .getResultList();
        }
        return alloys;
    }

    /**
     * Get alloys that have materials available for a specific shape.
     */
    public List<Category> getAvailableAlloysForShape(String shapeKey) {
        if (shapeKey == null) {
            return new ArrayList<>();
        }

        try {
            // Find alloys that have at least one product with the matching shape
            return em.createQuery(
                "SELECT DISTINCT alloy FROM Category alloy " +
                "WHERE alloy.parent.key = 'ALLOY' " +
                "AND EXISTS (SELECT p FROM Product p " +
                "            JOIN p.categories shape " +
                "            WHERE shape.key = :shapeKey " +
                "            AND alloy MEMBER OF p.categories) " +
                "ORDER BY alloy.name", Category.class)
                .setParameter("shapeKey", shapeKey)
                .getResultList();
        } catch (Exception e) {
            System.err.println("Error finding alloys for shape " + shapeKey + ": " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    /**
     * Calculate dimension difference for rectangular tubes, trying both orientations.
     */
    private BigDecimal calculateTubeDimensionDiff(Product product, BigDecimal targetWidth, BigDecimal targetHeight, BigDecimal targetThickness) {
        BigDecimal w = getPropertyValue(product, "WIDTH");
        BigDecimal h = getPropertyValue(product, "HEIGHT");
        BigDecimal t = getPropertyValue(product, "THICKNESS");

        if (w == null) w = BigDecimal.ZERO;
        if (h == null) h = BigDecimal.ZERO;
        if (t == null) t = BigDecimal.ZERO;

        // Try normal orientation (w matches targetWidth, h matches targetHeight)
        BigDecimal diff1 = targetWidth.subtract(w).abs()
            .add(targetHeight.subtract(h).abs());

        // Try swapped orientation (w matches targetHeight, h matches targetWidth)
        BigDecimal diff2 = targetWidth.subtract(h).abs()
            .add(targetHeight.subtract(w).abs());

        // Use the better match
        BigDecimal dimDiff = diff1.compareTo(diff2) <= 0 ? diff1 : diff2;

        // Add thickness difference (weighted more heavily)
        BigDecimal thicknessDiff = targetThickness.subtract(t).abs().multiply(BigDecimal.TEN);

        return dimDiff.add(thicknessDiff);
    }

    /**
     * Get the appropriate shape key for raw materials based on part shape.
     */
    private String getMaterialShapeKey(String partShapeKey) {
        if (partShapeKey == null) return null;

        switch (partShapeKey) {
            case "SHEET_METAL_FLAT":
            case "SHEET_METAL_FOLDED":
                // Sheet metal parts use flat sheet materials
                return "SHEET_METAL_FLAT";
            case "TUBE_RECTANGULAR":
            case "BENT_TUBE_RECTANGULAR":
                return "TUBE_RECTANGULAR";
            case "TUBE_ROUND":
            case "BENT_TUBE_ROUND":
                return "TUBE_ROUND";
            case "BAR_ROUND":
                return "BAR_ROUND";
            case "BAR_RECTANGULAR":
                return "BAR_RECTANGULAR";
            default:
                return partShapeKey;
        }
    }

    /**
     * Change the alloy for a part and find the best matching material.
     * Called when user selects a new alloy from the dropdown.
     */
    @Transactional
    public void changeAlloy(TreeNodeData nodeData) {
        if (nodeData == null || nodeData.getPart() == null) {
            return;
        }

        Category newAlloy = nodeData.getSelectedAlloy();
        System.out.println("changeAlloy called for part: " + nodeData.getName() + " with alloy: " + (newAlloy != null ? newAlloy.getName() : "null"));

        if (newAlloy == null) {
            // If no alloy selected, clear material
            nodeData.setRawMaterial(null);
            nodeData.setAvailableMaterials(new ArrayList<>());
            nodeData.setMaterialCost(BigDecimal.ZERO);
            nodeData.setProcessingCost(BigDecimal.ZERO);
            nodeData.setUnitCost(BigDecimal.ZERO);
        } else {
            // Find best matching material for this alloy and part dimensions
            Part part = nodeData.getPart();
            List<Product> candidates = findMaterialsForAlloy(part, newAlloy);

            System.out.println("Found " + candidates.size() + " candidate materials");

            if (!candidates.isEmpty()) {
                nodeData.setRawMaterial(candidates.get(0));
                nodeData.setAvailableMaterials(candidates);
                System.out.println("Selected material: " + candidates.get(0).getName());
            } else {
                nodeData.setRawMaterial(null);
                nodeData.setAvailableMaterials(new ArrayList<>());
            }

            // Recalculate costs
            calculateCosts(nodeData);
        }

        // Recalculate totals for entire tree
        recalculateTotals();

        System.out.println("New unit cost: " + nodeData.getUnitCost() + ", Total cost: " + totalCost);
    }

    /**
     * Find materials matching the part's shape, dimensions, and the specified alloy.
     */
    private List<Product> findMaterialsForAlloy(Part part, Category alloy) {
        if (part == null || part.getShape() == null || alloy == null) {
            return new ArrayList<>();
        }

        String shapeKey = part.getShape().getKey();

        switch (shapeKey) {
            case "SHEET_METAL_FLAT":
            case "SHEET_METAL_FOLDED":
                return findSheetMetalMaterialsForAlloy(part, alloy);
            case "TUBE_RECTANGULAR":
            case "BENT_TUBE_RECTANGULAR":
                return findRectangularTubeMaterialsForAlloy(part, alloy);
            case "TUBE_ROUND":
            case "BENT_TUBE_ROUND":
                return findRoundTubeMaterialsForAlloy(part, alloy);
            case "BAR_ROUND":
                return findRoundBarMaterialsForAlloy(part, alloy);
            default:
                return new ArrayList<>();
        }
    }

    private List<Product> findSheetMetalMaterialsForAlloy(Part part, Category alloy) {
        BigDecimal thickness = part.getThickness();
        if (thickness == null) thickness = BigDecimal.ONE;

        BigDecimal width = part.getFlatObbWidth();
        BigDecimal length = part.getFlatObbLength();

        if (width == null || width.compareTo(BigDecimal.ZERO) == 0) width = part.getDimX();
        if (length == null || length.compareTo(BigDecimal.ZERO) == 0) length = part.getDimY();
        if (width == null) width = BigDecimal.ZERO;
        if (length == null) length = BigDecimal.ZERO;

        // Ensure width <= length
        if (width.compareTo(length) > 0) {
            BigDecimal temp = width;
            width = length;
            length = temp;
        }

        System.out.println("findSheetMetalMaterialsForAlloy: alloy=" + alloy.getName() + " (id=" + alloy.getId() + ")" +
            ", thickness=" + thickness + ", width=" + width + ", length=" + length);

        try {
            // Find materials that have BOTH the shape category AND the alloy category
            List<Product> results = em.createQuery(
                "SELECT DISTINCT p FROM Product p " +
                "WHERE EXISTS (SELECT 1 FROM p.categories c WHERE c.key = 'SHEET_METAL_FLAT') " +
                "AND EXISTS (SELECT 1 FROM p.categories c WHERE c.id = :alloyId) " +
                "AND EXISTS (SELECT 1 FROM p.properties prop JOIN prop.propertyType pt " +
                "            WHERE pt.key = 'THICKNESS' AND prop.value = :thickness) " +
                "ORDER BY p.name", Product.class)
                .setParameter("alloyId", alloy.getId())
                .setParameter("thickness", thickness.setScale(2, RoundingMode.HALF_UP))
                .setMaxResults(10)
                .getResultList();

            System.out.println("Found " + results.size() + " materials with exact thickness");

            // If no exact thickness match, find any material with this alloy and shape
            if (results.isEmpty()) {
                results = em.createQuery(
                    "SELECT DISTINCT p FROM Product p " +
                    "WHERE EXISTS (SELECT 1 FROM p.categories c WHERE c.key = 'SHEET_METAL_FLAT') " +
                    "AND EXISTS (SELECT 1 FROM p.categories c WHERE c.id = :alloyId) " +
                    "ORDER BY p.name", Product.class)
                    .setParameter("alloyId", alloy.getId())
                    .setMaxResults(10)
                    .getResultList();

                System.out.println("Found " + results.size() + " materials without thickness filter");
            }

            return results;
        } catch (Exception e) {
            System.err.println("Error finding sheet metal materials for alloy: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    private List<Product> findRectangularTubeMaterialsForAlloy(Part part, Category alloy) {
        BigDecimal width = part.getSectionWidth();
        BigDecimal height = part.getSectionHeight();
        BigDecimal thickness = part.getThickness();

        if (width == null) width = BigDecimal.ZERO;
        if (height == null) height = BigDecimal.ZERO;
        if (thickness == null) thickness = BigDecimal.ONE;

        // Ensure width >= height for consistent matching
        if (width.compareTo(height) < 0) {
            BigDecimal temp = width;
            width = height;
            height = temp;
        }

        System.out.println("findRectangularTubeMaterialsForAlloy: alloy=" + alloy.getName() + " (id=" + alloy.getId() + ")" +
            ", width=" + width + ", height=" + height + ", thickness=" + thickness);

        final BigDecimal targetWidth = width;
        final BigDecimal targetHeight = height;
        final BigDecimal targetThickness = thickness;

        try {
            // Find rectangular tubes with matching alloy, then sort by best dimension match
            List<Product> results = em.createQuery(
                "SELECT DISTINCT p FROM Product p " +
                "WHERE EXISTS (SELECT 1 FROM p.categories c WHERE c.key = 'TUBE_RECTANGULAR') " +
                "AND EXISTS (SELECT 1 FROM p.categories c WHERE c.id = :alloyId) ", Product.class)
                .setParameter("alloyId", alloy.getId())
                .getResultList();

            System.out.println("Found " + results.size() + " rectangular tube materials before sorting");

            // Sort by closest dimension match (try both orientations)
            results.sort((p1, p2) -> {
                BigDecimal diff1 = calculateTubeDimensionDiff(p1, targetWidth, targetHeight, targetThickness);
                BigDecimal diff2 = calculateTubeDimensionDiff(p2, targetWidth, targetHeight, targetThickness);
                return diff1.compareTo(diff2);
            });

            // Return top 10
            if (results.size() > 10) {
                results = results.subList(0, 10);
            }

            if (!results.isEmpty()) {
                Product best = results.get(0);
                System.out.println("Best match: " + best.getName() +
                    " (W=" + getPropertyValue(best, "WIDTH") +
                    ", H=" + getPropertyValue(best, "HEIGHT") +
                    ", T=" + getPropertyValue(best, "THICKNESS") + ")");
            }

            return results;
        } catch (Exception e) {
            System.err.println("Error finding rectangular tube materials for alloy: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    private List<Product> findRoundTubeMaterialsForAlloy(Part part, Category alloy) {
        BigDecimal diameter = part.getDiameter();
        BigDecimal thickness = part.getThickness();

        if (diameter == null) diameter = BigDecimal.ZERO;
        if (thickness == null) thickness = BigDecimal.ONE;

        System.out.println("findRoundTubeMaterialsForAlloy: alloy=" + alloy.getName() + " (id=" + alloy.getId() + ")" +
            ", diameter=" + diameter + ", thickness=" + thickness);

        try {
            List<Product> results = em.createQuery(
                "SELECT DISTINCT p FROM Product p " +
                "WHERE EXISTS (SELECT 1 FROM p.categories c WHERE c.key = 'TUBE_ROUND') " +
                "AND EXISTS (SELECT 1 FROM p.categories c WHERE c.id = :alloyId) " +
                "ORDER BY p.name", Product.class)
                .setParameter("alloyId", alloy.getId())
                .setMaxResults(10)
                .getResultList();

            System.out.println("Found " + results.size() + " round tube materials");
            return results;
        } catch (Exception e) {
            System.err.println("Error finding round tube materials for alloy: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    private List<Product> findRoundBarMaterialsForAlloy(Part part, Category alloy) {
        BigDecimal diameter = part.getDiameter();
        if (diameter == null) diameter = BigDecimal.ZERO;

        System.out.println("findRoundBarMaterialsForAlloy: alloy=" + alloy.getName() + " (id=" + alloy.getId() + ")" +
            ", diameter=" + diameter);

        try {
            List<Product> results = em.createQuery(
                "SELECT DISTINCT p FROM Product p " +
                "WHERE EXISTS (SELECT 1 FROM p.categories c WHERE c.key = 'BAR_ROUND') " +
                "AND EXISTS (SELECT 1 FROM p.categories c WHERE c.id = :alloyId) " +
                "ORDER BY p.name", Product.class)
                .setParameter("alloyId", alloy.getId())
                .setMaxResults(10)
                .getResultList();

            System.out.println("Found " + results.size() + " round bar materials");
            return results;
        } catch (Exception e) {
            System.err.println("Error finding round bar materials for alloy: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
}
