import { Rect, Coords, Path, Direction, PathSegment } from "../locators";
import { GameSettings } from "./game-settings";

const __nodeSize = 10;
const __adjacentNodeParams: {k: number, d: Direction}[] = [
    { k: 1, d: 's' }, { k: Math.SQRT2, d: 'se' },
    { k: 1, d: 'e' }, { k: Math.SQRT2, d: 'ne' },
    { k: 1, d: 'n' }, { k: Math.SQRT2, d: 'nw' },
    { k: 1, d: 'w' }, { k: Math.SQRT2, d: 'sw' },
];

const __vectors: {[direction: string]: Coords} = {
    's': new Coords(0,1), 'se': new Coords(1,1), 'e': new Coords(1,0), 'ne': new Coords(1,-1),
    'n': new Coords(0,-1), 'nw': new Coords(-1,-1), 'w': new Coords(-1,0), 'sw': new Coords(-1,1)
};

export class PathService {
    private _obstacles: Obstacle[] = [];
    public set obstacles(value: Obstacle[]) { this._obstacles = value; }

    public calculateDirectPath(a: Coords, b: Coords): Path {
        return new Path(a, b, this._getDirectSegments(a, b));
    }

    public calculatePath(a: Coords, b: Coords, boundingBox: Rect): Path {
        let open: Node[] = [ new Node(a, b, 's', null, 0) ];
        let closed: Node[] = [];

        while (open.length > 0) {
            const q = open.shift();
            const adjacents = this._generateAdjacentNodes(q, boundingBox);
            for (const adj of adjacents) {
                if (adj.location.equals(b)) {
                    return new Path(a, b, this._generatePathSegments(q));
                }

                const openNode = open.find(x => x.location.equals(adj.location));
                if (openNode && openNode.f <= adj.f) {
                    continue;
                }

                const closedNode = closed.find(x => x.location.equals(adj.location));
                if (closedNode && closedNode.f <= adj.f) {
                    continue;
                }

                open.push(adj);
            }

            closed.push(q);
            open = open.sort(this._compareNodes);
        }
    }

    private _generatePathSegments(node: Node): PathSegment[] {
        const segments: PathSegment[] = this._getDirectSegments(node.location, node.destination);

        for (let q = node; q; q = q.parent) {
            if (q.g > 0) {
                if (segments.length === 0 || segments[0].direction !== q.direction) {
                    segments.unshift(new PathSegment(__vectors[q.direction], __nodeSize));
                }
                else {
                    segments[0].distance += __nodeSize;
                }
            }
        }
        
        return segments;
    }

    private _generateDebugInfo(destination: Coords, segments: PathSegment[]) {
        const segmentInfo: ISegmentDebugInfo[] = [];
        let previousStart = destination;
        for (const segment of [...segments].reverse()) {
            const start = previousStart.move(
                segment.vector.x * -segment.distance, 
                segment.vector.y * -segment.distance);
            
            segmentInfo.push(<ISegmentDebugInfo>{
                start: start,
                end: previousStart,
                distance: segment.distance,
                direction: segment.direction
            });

            previousStart = start;
        }

        return segmentInfo.reverse();
    }

    private _generateAdjacentNodes(q: Node, boundingBox: Rect) {
        const adjacents: Node[] = [];
        for (let nodeParams of __adjacentNodeParams) {
            const vector = __vectors[nodeParams.d];
            const newLocation = this._generateNodeLocation(q.location, q.destination, vector);
            const cost = this._calculateNodeCost(newLocation, boundingBox) * nodeParams.k;
            adjacents.push(new Node(newLocation, q.destination, nodeParams.d, q, cost));
        }
        return adjacents;
    }

    private _generateNodeLocation(location: Coords, destination: Coords, vector: Coords): Coords {
        const nodeEnd = location.move(vector.x * __nodeSize, vector.y * __nodeSize);
        const nodeRect = new Rect(
            Math.min(location.x, nodeEnd.x), Math.min(location.y, nodeEnd.y),
            Math.abs(location.x - nodeEnd.x) + 1, Math.abs(location.y - nodeEnd.y) + 1);
        
        return destination.within(nodeRect) ? destination : nodeEnd;
    }

    private _calculateNodeCost(location: Coords, relativeBoundingBox: Rect): number {
        const absoluteBoundingBox = new Rect(
            location.x + relativeBoundingBox.x,
            location.y + relativeBoundingBox.y,
            relativeBoundingBox.width,
            relativeBoundingBox.height);

        return 1 + this._obstacles
            .filter(x => absoluteBoundingBox.collidesWith(x.boundingBox))
            .reduce((weight, obstacle) => weight += obstacle.weight, 0);
    }

    private _compareNodes(a: Node, b: Node): number {
        if (a.f < b.f) {
            return -1;
        }
        else if (a.f > b.f) {
            return 1;
        }
        else {
            return 0;
        }
    }

    private _getDirectSegments(a: Coords, b: Coords): PathSegment[] {
        let deltaX = b.x - a.x;
        let deltaY = b.y - a.y;

        const segments: PathSegment[] = []
        while (deltaX != 0 || deltaY != 0) {
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);
            const vectorX = deltaX / (absDeltaX > 0 ? absDeltaX : 1);
            const vectorY = deltaY / (absDeltaY > 0 ? absDeltaY : 1);

            if (absDeltaY >= absDeltaX) {
                const distance = absDeltaX > 0 ? absDeltaX : absDeltaY;
                segments.push(new PathSegment(new Coords(vectorX, vectorY), distance));
                deltaY -= distance * vectorY;
                deltaX = 0;
            }
            else {
                const distance = absDeltaY > 0 ? absDeltaY : absDeltaX;
                segments.push(new PathSegment(new Coords(vectorX, vectorY), distance));
                deltaX -= distance * vectorX;
                deltaY = 0;
            }
        }

        return segments;
    }
}

class Node {
    public location: Coords;
    public destination: Coords;
    public direction: Direction;
    public parent: Node;
    public f: number;
    public g: number;
    public h: number;

    constructor(location: Coords, destination: Coords, direction: Direction, parent: Node, cost: number) {
        this.location = location;
        this.destination = destination;
        this.direction = direction;
        this.parent = parent;
        this.g = (parent != null ? parent.g : 0) + cost;
        this.h = Math.sqrt(Math.pow(location.x - destination.x, 2) + Math.pow(location.y - destination.y, 2));
        this.f = this.g + this.h;
    }
}

export class Obstacle {
    boundingBox: Rect;
    weight: number;

    constructor(boundingBox: Rect, weight: number) {
        this.boundingBox = boundingBox;
        this.weight = weight;
    }
}

interface ISegmentDebugInfo {
    start: Coords;
    end: Coords;
    distance: number;
    direction: Direction;
}