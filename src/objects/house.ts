import { Coords, Rect } from "../locators";
import { ArrayAnimator } from "../animators";
import { DrawContext, SpriteService, ServiceProvider } from "../services";
import { SequenceAnimator } from "../animators/sequence-animator";



export class House {
    public static boundingRect: Rect = new Rect(-44, -11, 88, 40);

    private _poopLocation = new Coords(-42, -55);
    private _doorLocation = new Coords(-27, -27);
    private _blastDoorLocation = new Coords(-25, -11);
    private _steam1Location = new Coords(10, -20);
    private _steam2Location = new Coords(-16, 0);
    private _glimmerMLocation: Coords = null;
    private _glimmerSLocation: Coords = null;

    private _glimmerMLocationAnimator = new ArrayAnimator<Coords>(
        [-55, -54, -52, -51, -50, -50, -51, -52, -54, -55].map(y => new Coords(-24, y)), true);
    
    private _glimmerSLocationAnimator = new ArrayAnimator<Coords>(
        [-26, -26, -27, -27, -28, -28, -27, -27, -26, -26].map(y => new Coords(25, y)), true);

    private _doorState = 'closed';
    private _doorOpeningAnimator: SequenceAnimator;
    private _doorClosingAnimator: SequenceAnimator;

    constructor() {
        const spriteService = new ServiceProvider().SpriteService;

        this._doorOpeningAnimator = new SequenceAnimator([
            { name: 'door', atTick: 0, begin: spriteService.getAnimator('door-opening'), before: 'door:closed', after: 'door:open' },
            { name: 'steam1', atTick: 0, begin: spriteService.getAnimator('steam-1'), before: null, after: null },
            { name: 'blastdoor', atTick: 14, begin: spriteService.getAnimator('blast-door-opening'), before: 'blast-door:closed', after: 'blast-door:open' },
            { name: 'steam2', atTick: 14, begin: spriteService.getAnimator('steam-2'), before: null, after: null },
        ])
        
        this._doorClosingAnimator = new SequenceAnimator([
            { name: 'blastdoor', atTick: 0, begin: spriteService.getAnimator('blast-door-closing'), before: 'blast-door:open', after: 'blast-door:closed'},
            { name: 'door', atTick: 3, begin: spriteService.getAnimator('door-closing'), before: 'door:open', after: 'door:closed' }
        ]);
    }

    get door(): string { return this._doorState; }
 
    openDoor() {
        if (this._doorState == 'closed') {
            this._doorState = 'opening';
        }
    }

    closeDoor() {
        if (this._doorState == 'open') {
            this._doorState = 'closing';
        }
    }


    update(ticks: number) {

        this._glimmerMLocation = this._glimmerMLocationAnimator.next(ticks);
        this._glimmerSLocation = this._glimmerSLocationAnimator.next(ticks);

        if (this._doorState == 'opening') {
            if (this._doorOpeningAnimator.finished()) {

                this._doorState = 'open';
                this._doorOpeningAnimator.reset();

            }
            else {
                this._doorOpeningAnimator.next(ticks);
            }
        }
        
        if (this._doorState == 'closing') {
            if (this._doorClosingAnimator.finished()) {
                
                this._doorState = 'closed';
                this._doorClosingAnimator.reset();
            }
            else {
                this._doorClosingAnimator.next(ticks);
            }
        }
    }

    draw(context: DrawContext, sprites: SpriteService) {
        sprites.drawSprite(context, 'poop:00', this._poopLocation);
        
        switch(this._doorState) {
            case 'closed': 
                sprites.drawSprite(context, 'door:closed', this._doorLocation);
                break;
            case 'opening':
                const openingFrames = this._doorOpeningAnimator.value();    
                sprites.drawSprite(context, openingFrames['blastdoor'], this._blastDoorLocation);
                sprites.drawSprite(context, openingFrames['door'], this._doorLocation);
                sprites.drawSprite(context, openingFrames['steam1'], this._steam1Location);
                sprites.drawSprite(context, openingFrames['steam2'], this._steam2Location);
                break;
            case 'open':
                sprites.drawSprite(context, 'door:open', this._doorLocation);
                sprites.drawSprite(context, 'blast-door:open', this._blastDoorLocation);
                break;
            case 'closing':
                const closingFrames = this._doorClosingAnimator.value();    
                sprites.drawSprite(context, closingFrames['blastdoor'], this._blastDoorLocation);
                sprites.drawSprite(context, closingFrames['door'], this._doorLocation);
                break;
        }
        
        
        sprites.drawSprite(context, 'glimmer-m:00', this._glimmerMLocation);
        sprites.drawSprite(context, 'glimmer-s:00', this._glimmerSLocation);


    }
}