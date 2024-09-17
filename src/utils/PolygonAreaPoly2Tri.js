import {SweepContext, Point} from 'poly2tri';
import {eigs} from "mathjs";

// Function to calculate cross product of two vectors in 3D
function crossProduct(v1, v2) {
    return [
        v1[1] * v2[2] - v1[2] * v2[1], // i component
        v1[2] * v2[0] - v1[0] * v2[2], // j component
        v1[0] * v2[1] - v1[1] * v2[0]  // k component
    ];
}

// Function to calculate the magnitude of a vector in 3D
function magnitude(vector) {
    return Math.sqrt(vector[0] ** 2 + vector[1] ** 2 + vector[2] ** 2);
}

// Function to calculate area of a triangle in 3D given 3 vertices
function triangleArea3D(A, B, C) {
    const AB = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    const AC = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];

    const crossProd = crossProduct(AB, AC);

    return 0.5 * magnitude(crossProd);
}

// Function to calculate the normal of a 3D polygon (using the first 3 points)
function calculateNormal(vertices) {
    const v1 = [vertices[1][0] - vertices[0][0], vertices[1][1] - vertices[0][1], vertices[1][2] - vertices[0][2]];
    const v2 = [vertices[2][0] - vertices[0][0], vertices[2][1] - vertices[0][1], vertices[2][2] - vertices[0][2]];
    const normal = crossProduct(v1, v2);
    const magnitudeNormal = magnitude(normal);

    return normal.map(v => v / magnitudeNormal);  // Normalize the normal vector
}

function centerVertices(vertices, centroid) {
    return vertices.map(vertex => vertex.map((coord, idx) => coord - centroid[idx]));
}

function computeCovarianceMatrix(vertices) {
    const covarianceMatrix = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

    vertices.forEach(vertex => {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                covarianceMatrix[i][j] += vertex[i] * vertex[j];
            }
        }
    });

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            covarianceMatrix[i][j] /= vertices.length;
        }
    }

    return covarianceMatrix;
}

function performPCA(covarianceMatrix) {
    const {eigenvectors} = eigs(covarianceMatrix);
    eigenvectors.sort((a, b) => b.value - a.value);

    const u = eigenvectors[0].vector;
    const v = eigenvectors[1].vector;

    return {u, v};
}

function roundPoints(points, decimalPlaces = 8) {
    return points.map(point =>
        point.map(coord => Number(coord.toFixed(decimalPlaces)))
    );
}

function normalizeAndDeduplicate(points) {
    const xValues = points.map(p => p[0]);
    const yValues = points.map(p => p[1]);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const maxRange = Math.max(xRange, yRange);

    // Normalize points
    const _normalized = points.map(p => [
        1000 * (p[0] - xMin) / maxRange,
        1000 * (p[1] - yMin) / maxRange
    ]);

    const normalized = roundPoints(_normalized);

    // Deduplicate points
    const uniquePoints = [];
    const seen = new Set();
    for (const point of normalized) {
        const key = point.join(',');
        if (!seen.has(key)) {
            seen.add(key);
            uniquePoints.push(point);
        }
    }

    return uniquePoints;
}

function projectToBestFitPlane(vertices) {
    const centroid = vertices.reduce((acc, vertex) => {
        return acc.map((sum, idx) => sum + vertex[idx]);
    }, [0, 0, 0]).map(sum => sum / vertices.length);

    const centeredVertices = centerVertices(vertices, centroid);
    const covarianceMatrix = computeCovarianceMatrix(centeredVertices);
    const {u, v} = performPCA(covarianceMatrix);

    const projected = vertices.map(vertex => {
        const x = vertex[0] * u[0] + vertex[1] * u[1] + vertex[2] * u[2];
        const y = vertex[0] * v[0] + vertex[1] * v[1] + vertex[2] * v[2];
        return [x, y];
    });

    const _normalizedUniqueProjected = normalizeAndDeduplicate(projected);
    const normalizedUniqueProjected = _normalizedUniqueProjected.map(([x, y]) => new Point(x, y));

    return {projected: normalizedUniqueProjected, u, v, centroid};
}

// Function to flatten the 2D points array for triangulation
function flattenVertices(vertices) {
    return vertices.reduce((flat, point) => flat.concat(point), []);
}

function mapTo3D(triangles2DIndices, vertices3D) {
    const triangles3D = [];

    // Map each 2D triangle index back to the original 3D points
    for (let i = 0; i < triangles2DIndices.length; i += 3) {
        const vertexIndexA = triangles2DIndices[i];
        const vertexIndexB = triangles2DIndices[i + 1];
        const vertexIndexC = triangles2DIndices[i + 2];

        // Use the original 3D vertices instead of recalculating any Z component
        const A = vertices3D[vertexIndexA];
        const B = vertices3D[vertexIndexB];
        const C = vertices3D[vertexIndexC];

        // Add the original 3D triangle without modifying Z
        triangles3D.push([A, B, C]);
    }

    return triangles3D;
}

export function getPolygonTriangulation(vertices) {
    // Function to calculate Euclidean distance between two points
    function getDistance(p1, p2) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }

    // Function to find the index of a point in the projected array
    function findPointIndexInProjected(projected, targetPoint) {
        let nearestIndex = -1;
        let minDistance = Infinity;

        projected.forEach((point, index) => {
            const distance = getDistance(point, targetPoint);
            if (distance < minDistance) {
                minDistance = distance;
                nearestIndex = index;
            }
        });

        return nearestIndex;
    }

    // Function to map each triangle's points_ to indices in the projected array
    function mapTrianglesToIndices(triangles, projected, vertices) {
        return triangles.map(triangle => {
            return triangle.points_.map(point => {
                const indice = findPointIndexInProjected(projected, point);
                return vertices[indice];
            });
        });
    }

    try {
        const { projected } = projectToBestFitPlane(vertices);
        const origProjected = [...projected];

        // Perform triangulation
        const sweepContext = new SweepContext(projected);
        sweepContext.triangulate();
        const triangles2D = sweepContext.getTriangles();

        const triangles = mapTrianglesToIndices(triangles2D, origProjected, vertices);

        return triangles;
    } catch (err) {
        console.error(err);
        return undefined;
    }

}

// Function to calculate the total surface area of the polygon
export default function calculatePolygonSurfaceArea(vertices) {
    try {
        let totalArea = 0;
        const triangles = getPolygonTriangulation(vertices);

        if (!triangles) {
            return 0;
        }

        triangles.forEach(triangle => {
            totalArea += triangleArea3D(triangle[0], triangle[1], triangle[2]);
        });

        return totalArea;
    } catch (err) {
        return 0;
    }
}

