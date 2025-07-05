import { expect } from 'chai';
import { Rect } from '../locators/rect';
import { Coords } from '../locators/coords';

describe('Rect', () => {
    describe('properties', () => {
        it('should calculate x2 and y2 correctly', () => {
            const rect = new Rect(10, 20, 30, 40);
            expect(rect.x2).to.equal(40); // 10 + 30
            expect(rect.y2).to.equal(60); // 20 + 40
        });
    });

    describe('collidesWith', () => {
        it('should detect collision between overlapping rectangles', () => {
            const rect1 = new Rect(0, 0, 10, 10);
            const rect2 = new Rect(5, 5, 10, 10);
            
            expect(rect1.collidesWith(rect2)).to.be.true;
            expect(rect2.collidesWith(rect1)).to.be.true;
        });

        it('should not detect collision between separated rectangles', () => {
            const rect1 = new Rect(0, 0, 10, 10);
            const rect2 = new Rect(20, 20, 10, 10);
            
            expect(rect1.collidesWith(rect2)).to.be.false;
            expect(rect2.collidesWith(rect1)).to.be.false;
        });

        it('should not detect collision for adjacent rectangles', () => {
            const rect1 = new Rect(0, 0, 10, 10);
            const rect2 = new Rect(10, 0, 10, 10); // Touching but not overlapping
            
            expect(rect1.collidesWith(rect2)).to.be.false;
        });
    });

    describe('getRandomLocation', () => {
        it('should return a location within the rectangle bounds', () => {
            const rect = new Rect(10, 20, 100, 200);
            
            // Test multiple random locations
            for (let i = 0; i < 10; i++) {
                const location = rect.getRandomLocation();
                expect(location.x).to.be.at.least(rect.x);
                expect(location.x).to.be.at.most(rect.x2);
                expect(location.y).to.be.at.least(rect.y);
                expect(location.y).to.be.at.most(rect.y2);
            }
        });
    });
});