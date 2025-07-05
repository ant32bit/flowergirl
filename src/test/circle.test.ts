import { expect } from 'chai';
import { Circle } from '../locators/circle';
import { Coords } from '../locators/coords';
import { Rect } from '../locators/rect';

describe('Circle', () => {
    describe('constructor', () => {
        it('should create a circle with center and radius', () => {
            const circle = new Circle(10, 20, 5);
            expect(circle.centre.x).to.equal(10);
            expect(circle.centre.y).to.equal(20);
            expect(circle.radius).to.equal(5);
        });
    });

    describe('contains', () => {
        it('should return true for points inside the circle', () => {
            const circle = new Circle(0, 0, 10);
            expect(circle.contains(new Coords(0, 0))).to.be.true; // Center
            expect(circle.contains(new Coords(5, 0))).to.be.true; // Inside
            expect(circle.contains(new Coords(0, 8))).to.be.true; // Inside
        });

        it('should return true for points on the circle edge', () => {
            const circle = new Circle(0, 0, 10);
            expect(circle.contains(new Coords(10, 0))).to.be.true; // On edge
            expect(circle.contains(new Coords(0, 10))).to.be.true; // On edge
        });

        it('should return false for points outside the circle', () => {
            const circle = new Circle(0, 0, 10);
            expect(circle.contains(new Coords(15, 0))).to.be.false; // Outside
            expect(circle.contains(new Coords(8, 8))).to.be.false; // Outside corner
        });
    });

    describe('intersectsWith', () => {
        it('should detect intersection with overlapping circles', () => {
            const circle1 = new Circle(0, 0, 5);
            const circle2 = new Circle(3, 0, 5);
            expect(circle1.intersectsWith(circle2)).to.be.true;
        });

        it('should detect intersection with touching circles', () => {
            const circle1 = new Circle(0, 0, 5);
            const circle2 = new Circle(10, 0, 5);
            expect(circle1.intersectsWith(circle2)).to.be.true;
        });

        it('should not detect intersection with separated circles', () => {
            const circle1 = new Circle(0, 0, 5);
            const circle2 = new Circle(20, 0, 5);
            expect(circle1.intersectsWith(circle2)).to.be.false;
        });
    });

    describe('collidesWith', () => {
        it('should detect collision when circle center is inside rectangle', () => {
            const circle = new Circle(5, 5, 2);
            const rect = new Rect(0, 0, 10, 10);
            expect(circle.collidesWith(rect)).to.be.true;
        });

        it('should not detect collision when circle is completely outside rectangle', () => {
            const circle = new Circle(20, 20, 2);
            const rect = new Rect(0, 0, 10, 10);
            expect(circle.collidesWith(rect)).to.be.false;
        });
    });

    describe('translatePolar', () => {
        it('should translate circle using polar coordinates', () => {
            const circle = new Circle(0, 0, 10);
            const point = circle.translatePolar(0, 1); // 0 radians (east), full radius
            expect(point.x).to.be.closeTo(10, 0.01);
            expect(point.y).to.be.closeTo(0, 0.01);
        });

        it('should translate circle using polar coordinates at 90 degrees', () => {
            const circle = new Circle(0, 0, 10);
            const point = circle.translatePolar(Math.PI / 2, 0.5); // 90 degrees (north), half radius
            expect(point.x).to.be.closeTo(0, 0.01);
            expect(point.y).to.be.closeTo(-5, 0.01); // Negative because Y is flipped in screen coordinates
        });
    });

    describe('getRandomLocation', () => {
        it('should return a location within the circle', () => {
            const circle = new Circle(10, 10, 5);
            
            // Test multiple random locations
            for (let i = 0; i < 20; i++) {
                const location = circle.getRandomLocation();
                expect(circle.contains(location)).to.be.true;
            }
        });
    });
});