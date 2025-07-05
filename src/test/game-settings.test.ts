import { expect } from 'chai';

// Mock browser globals for Node.js testing
(global as any).window = {
    settings: {}
};
(global as any).location = {
    href: 'http://localhost:3000'
};

import { GameSettings } from '../services/game-settings';

describe('GameSettings', () => {
    // Note: These tests may affect global state, so we test current behavior
    // In a real app, you might want to mock or reset settings between tests
    
    describe('default values', () => {
        it('should have default FPS value', () => {
            expect(GameSettings.FPS).to.be.a('number');
            expect(GameSettings.FPS).to.be.at.least(4);
            expect(GameSettings.FPS).to.be.at.most(60);
        });

        it('should have default Debug value', () => {
            expect(GameSettings.Debug).to.be.a('boolean');
        });

        it('should have default Algorithm value', () => {
            expect(GameSettings.Algorithm).to.be.a('string');
            expect(['closest', 'random']).to.include(GameSettings.Algorithm);
        });

        it('should have default Pace value', () => {
            expect(GameSettings.Pace).to.be.a('number');
            expect(GameSettings.Pace).to.be.at.least(1);
        });

        it('should have default FlockRadius value', () => {
            expect(GameSettings.FlockRadius).to.be.a('number');
            expect(GameSettings.FlockRadius).to.be.at.least(5);
        });
    });

    describe('value constraints', () => {
        it('should have FPS within expected range', () => {
            const fps = GameSettings.FPS;
            expect(fps).to.be.at.least(4);
            expect(fps).to.be.at.most(60);
        });

        it('should have valid Algorithm value', () => {
            const algorithm = GameSettings.Algorithm;
            expect(['closest', 'random']).to.include(algorithm);
        });

        it('should have positive Pace value', () => {
            expect(GameSettings.Pace).to.be.above(0);
        });

        it('should have reasonable FlockRadius value', () => {
            const radius = GameSettings.FlockRadius;
            expect(radius).to.be.at.least(5);
            expect(radius).to.be.at.most(100); // Reasonable upper bound
        });
    });

    describe('property types', () => {
        it('should return number for FPS', () => {
            expect(typeof GameSettings.FPS).to.equal('number');
        });

        it('should return boolean for Debug', () => {
            expect(typeof GameSettings.Debug).to.equal('boolean');
        });

        it('should return string for Algorithm', () => {
            expect(typeof GameSettings.Algorithm).to.equal('string');
        });

        it('should return number for Pace', () => {
            expect(typeof GameSettings.Pace).to.equal('number');
        });

        it('should return number for FlockRadius', () => {
            expect(typeof GameSettings.FlockRadius).to.equal('number');
        });
    });
});