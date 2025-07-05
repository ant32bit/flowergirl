import { expect } from 'chai';
import { Path, PathSegment } from '../locators/path';
import { Coords } from '../locators/coords';

describe('PathSegment', () => {
    describe('constructor', () => {
        it('should create a path segment with vector and distance', () => {
            const segment = new PathSegment(new Coords(1, 0), 10);
            expect(segment.vector.x).to.equal(1);
            expect(segment.vector.y).to.equal(0);
            expect(segment.distance).to.equal(10);
            expect(segment.direction).to.equal('e'); // East direction
        });

        it('should calculate correct direction for different vectors', () => {
            const eastSegment = new PathSegment(new Coords(1, 0), 10);
            expect(eastSegment.direction).to.equal('e');

            const southSegment = new PathSegment(new Coords(0, 1), 10);
            expect(southSegment.direction).to.equal('s');

            const southEastSegment = new PathSegment(new Coords(1, 1), 10);
            expect(southEastSegment.direction).to.equal('se');
        });
    });
});

describe('Path', () => {
    describe('constructor', () => {
        it('should create a path with start, end, and segments', () => {
            const start = new Coords(0, 0);
            const end = new Coords(10, 0);
            const segments = [new PathSegment(new Coords(1, 0), 10)];
            
            const path = new Path(start, end, segments);
            expect(path.location.x).to.equal(0);
            expect(path.location.y).to.equal(0);
        });
    });

    describe('move', () => {
        it('should move along the path by specified distance', () => {
            const start = new Coords(0, 0);
            const end = new Coords(10, 0);
            const segments = [new PathSegment(new Coords(1, 0), 10)];
            
            const path = new Path(start, end, segments);
            path.move(5);
            
            expect(path.location.x).to.equal(5);
            expect(path.location.y).to.equal(0);
        });

        it('should not move beyond the end of the path', () => {
            const start = new Coords(0, 0);
            const end = new Coords(10, 0);
            const segments = [new PathSegment(new Coords(1, 0), 10)];
            
            const path = new Path(start, end, segments);
            path.move(15); // Move more than path length
            
            expect(path.location.x).to.equal(10);
            expect(path.location.y).to.equal(0);
            expect(path.finished).to.be.true;
        });
    });

    describe('direction', () => {
        it('should return correct cardinal direction for horizontal movement', () => {
            const start = new Coords(0, 0);
            const end = new Coords(10, 0);
            const segments = [new PathSegment(new Coords(1, 0), 10)];
            
            const path = new Path(start, end, segments);
            expect(path.direction).to.equal('e'); // East
        });

        it('should return correct cardinal direction for vertical movement', () => {
            const start = new Coords(0, 0);
            const end = new Coords(0, 10);
            const segments = [new PathSegment(new Coords(0, 1), 10)];
            
            const path = new Path(start, end, segments);
            expect(path.direction).to.equal('s'); // South
        });

        it('should return correct diagonal direction', () => {
            const start = new Coords(0, 0);
            const end = new Coords(10, 10);
            const segments = [new PathSegment(new Coords(1, 1), 14.14)];
            
            const path = new Path(start, end, segments);
            expect(path.direction).to.equal('se'); // Southeast
        });
    });

    describe('finished property', () => {
        it('should return true when path has no segments', () => {
            const start = new Coords(0, 0);
            const end = new Coords(10, 20);
            const path = new Path(start, end, []);
            
            expect(path.finished).to.be.true;
        });

        it('should return false when path has segments', () => {
            const start = new Coords(0, 0);
            const end = new Coords(10, 20);
            const segments = [new PathSegment(new Coords(1, 0), 10)];
            const path = new Path(start, end, segments);
            
            expect(path.finished).to.be.false;
        });
    });

    describe('then', () => {
        it('should chain paths together', () => {
            const start = new Coords(0, 0);
            const middle = new Coords(10, 0);
            const end = new Coords(10, 10);
            
            const path1 = new Path(start, middle, [new PathSegment(new Coords(1, 0), 10)]);
            const path2 = new Path(middle, end, [new PathSegment(new Coords(0, 1), 10)]);
            
            const combinedPath = path1.then(path2);
            
            // Move through first segment
            combinedPath.move(10);
            expect(combinedPath.location.x).to.equal(10);
            expect(combinedPath.location.y).to.equal(0);
            
            // Move through second segment
            combinedPath.move(5);
            expect(combinedPath.location.x).to.equal(10);
            expect(combinedPath.location.y).to.equal(5);
        });
    });
});