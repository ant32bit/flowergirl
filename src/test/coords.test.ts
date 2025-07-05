import { expect } from 'chai';
import { Coords } from '../locators/coords';

describe('Coords', () => {
    describe('constructor', () => {
        it('should create a new Coords object with x and y values', () => {
            const coords = new Coords(10, 20);
            expect(coords.x).to.equal(10);
            expect(coords.y).to.equal(20);
        });
    });

    describe('move', () => {
        it('should return a new Coords object with offset values', () => {
            const coords = new Coords(10, 20);
            const moved = coords.move(5, -3);
            
            expect(moved.x).to.equal(15);
            expect(moved.y).to.equal(17);
            // Original should be unchanged
            expect(coords.x).to.equal(10);
            expect(coords.y).to.equal(20);
        });
    });

    describe('distance', () => {
        it('should calculate distance between two coordinates', () => {
            const coords1 = new Coords(0, 0);
            const coords2 = new Coords(3, 4);
            const distance = coords1.distance(coords2);
            
            expect(distance).to.equal(5); // 3-4-5 triangle
        });

        it('should return 0 for same coordinates', () => {
            const coords = new Coords(10, 20);
            const distance = coords.distance(coords);
            
            expect(distance).to.equal(0);
        });
    });
});