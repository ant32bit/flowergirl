import { expect } from 'chai';
import { ArrayAnimator } from '../animators/array-animator';

describe('ArrayAnimator', () => {
    describe('constructor', () => {
        it('should create animator with array and loop setting', () => {
            const frames = ['frame1', 'frame2', 'frame3'];
            const animator = new ArrayAnimator(frames, true);
            
            expect(animator.value()).to.equal('frame1');
        });

        it('should handle empty array', () => {
            const animator = new ArrayAnimator([], false);
            expect(animator.value()).to.be.undefined;
            expect(animator.finished()).to.be.true;
        });
    });

    describe('next', () => {
        it('should advance to next frame', () => {
            const frames = ['frame1', 'frame2', 'frame3'];
            const animator = new ArrayAnimator(frames, false);
            
            expect(animator.value()).to.equal('frame1'); // _index = -1, but returns [0]
            animator.next(1); // _index = 0
            expect(animator.value()).to.equal('frame1');
            animator.next(1); // _index = 1
            expect(animator.value()).to.equal('frame2');
            animator.next(1); // _index = 2
            expect(animator.value()).to.equal('frame3');
        });

        it('should advance multiple ticks at once', () => {
            const frames = ['frame1', 'frame2', 'frame3', 'frame4'];
            const animator = new ArrayAnimator(frames, false);
            
            animator.next(3); // _index goes from -1 to 2
            expect(animator.value()).to.equal('frame3');
        });

        it('should loop when loop is enabled', () => {
            const frames = ['frame1', 'frame2', 'frame3'];
            const animator = new ArrayAnimator(frames, true);
            
            animator.next(4); // _index goes from -1 to 3, then 3 % 3 = 0
            expect(animator.value()).to.equal('frame1'); // Should loop back
            expect(animator.finished()).to.be.false;
        });

        it('should not loop when loop is disabled', () => {
            const frames = ['frame1', 'frame2', 'frame3'];
            const animator = new ArrayAnimator(frames, false);
            
            animator.next(5); // Go past end
            expect(animator.value()).to.equal('frame3'); // Should stay at last frame
            expect(animator.finished()).to.be.true;
        });
    });

    describe('finished', () => {
        it('should return false for looping animator', () => {
            const frames = ['frame1', 'frame2'];
            const animator = new ArrayAnimator(frames, true);
            
            animator.next(10); // Advance way past end
            expect(animator.finished()).to.be.false;
        });

        it('should return true when non-looping animator reaches end', () => {
            const frames = ['frame1', 'frame2'];
            const animator = new ArrayAnimator(frames, false);
            
            animator.next(2); // Reach end
            expect(animator.finished()).to.be.true;
        });

        it('should return false when non-looping animator is not at end', () => {
            const frames = ['frame1', 'frame2', 'frame3'];
            const animator = new ArrayAnimator(frames, false);
            
            animator.next(1); // Not at end yet
            expect(animator.finished()).to.be.false;
        });
    });

    describe('reset', () => {
        it('should reset animator to beginning', () => {
            const frames = ['frame1', 'frame2', 'frame3'];
            const animator = new ArrayAnimator(frames, false);
            
            animator.next(3); // Advance to index 2
            expect(animator.value()).to.equal('frame3');
            
            animator.reset();
            expect(animator.value()).to.equal('frame1'); // Back to initial state
            expect(animator.finished()).to.be.false;
        });
    });

    describe('edge cases', () => {
        it('should handle single frame animation', () => {
            const frames = ['onlyframe'];
            const animator = new ArrayAnimator(frames, false);
            
            expect(animator.value()).to.equal('onlyframe');
            animator.next(1);
            expect(animator.value()).to.equal('onlyframe');
            expect(animator.finished()).to.be.true;
        });

        it('should handle single frame looping animation', () => {
            const frames = ['onlyframe'];
            const animator = new ArrayAnimator(frames, true);
            
            expect(animator.value()).to.equal('onlyframe');
            animator.next(5);
            expect(animator.value()).to.equal('onlyframe');
            expect(animator.finished()).to.be.false;
        });
    });
});