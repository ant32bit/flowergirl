import { Coords, Rect } from "../locators";
import { ArrayAnimator } from "../animators";
import { DrawContext } from "./game-loop-service";

class SpriteLibraryBuilder {
    private _categories: {[key: string]: SpriteCategory} = {};
    private _imgWidth: number;

    private _currX: number = 0;
    private _currY: number = 0;
    private _currCategoryName: string;
    private _currCategory: SpriteCategory = null;
    private _currLineMaxHeight: number = 0;

    constructor(imgWidth: number) { this._imgWidth = imgWidth; }

    public addCategory(name: string, spriteWidth: number, spriteHeight: number) {
        this._saveCategory();
        this._currCategoryName = name;
        this._currCategory = new SpriteCategory(spriteWidth, spriteHeight);
    }

    public addFrames(...names: string[]) {
        for(const name of names) {
            if (this._currX + this._currCategory.width > this._imgWidth) {
                this._currX = 0;
                this._currY += this._currLineMaxHeight;
                this._currLineMaxHeight = 0;
            }

            if (this._currLineMaxHeight < this._currCategory.height) {
                this._currLineMaxHeight = this._currCategory.height;
            }

            this._currCategory.frames[name] = new SpriteFrame(this._currX, this._currY);
            this._currX += this._currCategory.width;
        }
    }

    build(): {[key: string]: SpriteCategory} {
        this._saveCategory();
        return this._categories;
    }

    private _saveCategory() {
        if (this._currCategory && Object.keys(this._currCategory.frames).length > 0) {
            this._categories[this._currCategoryName || '_default'] = this._currCategory;
        }
    } 
}

class SpriteCategory {
    width: number;
    height: number;
    frames: {[key: string]: SpriteFrame}

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.frames = {};
    }
}

class SpriteFrame {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class SpriteAnimation {
    loop: boolean;
    frames: string[];

    constructor(category: string, frames: string, loop: boolean = true) {
        this.loop = loop;
        const framesComponents = frames.split(':');
        let frameCount: number;
        let frameIds: string[];

        if (framesComponents.length === 2) {
            frameCount = parseInt(framesComponents[0]);
            frameIds = framesComponents[1].split(',');
        }
        else {
            frameCount = 1;
            frameIds = frames.split(',');
        }

        const animationFrames: string[] = [];
        for(const frameId of frameIds) {
            for(let i = 0; i < frameCount; i++) {
                animationFrames.push([category, frameId].join(':'));
            }
        }
        this.frames = animationFrames;
    }

    toAnimator(): ArrayAnimator<string> {
        return new ArrayAnimator<string>(this.frames, this.loop);
    }
}

export class SpriteService {
    private static _sprites = (() => {
        const img = new Image();
        img.src = '0a1514186a700c4b7adf08270a4f26fa.png';
        return img;
    })();

    private static _categories: {[key: string]: SpriteCategory} = (() => {
        const builder = new SpriteLibraryBuilder(256);
        builder.addCategory('girl', 32, 32);
        builder.addFrames('s0','s1','s','s2','s3');
        builder.addFrames('se0','se1','se','se2','se3');
        builder.addFrames('e0','e1','e','e2','e3');
        builder.addFrames('ne0','ne1','ne','ne2','ne3');
        builder.addFrames('n0','n1','n','n2','n3');
        builder.addFrames('nw0','nw1','nw','nw2','nw3');
        builder.addFrames('w0','w1','w','w2','w3');
        builder.addFrames('sw0','sw1','sw','sw2','sw3');

        builder.addCategory('girl-attack-1', 48, 32);
        builder.addFrames('00','01','02','hit');

        builder.addCategory('girl-attack-2', 32, 48);
        builder.addFrames('00','01','02','hit');

        builder.addCategory('girl-attack-3', 48, 32);
        builder.addFrames('00','01','hit','02');

        builder.addCategory('girl-attack-4', 48, 32);
        builder.addFrames(...'00,01,02,03,04,hit,05,06,07,08,09,10,11,12,13,14'.split(','));

        builder.addCategory('flower', 16, 32);
        builder.addFrames('b0','b1','b2','b3');
        builder.addFrames('db0','db1','db2');
        builder.addFrames('daisy','d0','d1');
        builder.addFrames('daisy-dead','daisy-dead-float');
        builder.addFrames('rb0','rb1','rb2');
        builder.addFrames('rose','r0','r1');
        builder.addFrames('rose-dead','rose-dead-float');
        
        builder.addCategory('steam-1', 20, 20);
        builder.addFrames('00','01','02','03','04','05','06');

        builder.addCategory('steam-2', 32, 20);
        builder.addFrames('00','01','02','03','04');

        builder.addCategory('blast-door', 48, 24);
        builder.addFrames(...'closed,01,02,03,04,05,06,07,08,open'.split(','));

        builder.addCategory('door', 52, 54);
        builder.addFrames(...'closed,00,01,02,03,04,05,06,07,08,09,open'.split(','));

        builder.addCategory('poop', 86, 77);
        builder.addFrames('00');

        builder.addCategory('room', 37, 25);
        builder.addFrames('00');

        builder.addCategory('glimmer-m', 13, 21);
        builder.addFrames('00');

        builder.addCategory('glimmer-s', 7, 13);
        builder.addFrames('00');

        const categories = builder.build();
        return categories;
    })();
    
    private static _animations: {[key: string]: SpriteAnimation} = {
        'door-opening': new SpriteAnimation('door', '00,01,02,02,02,02,03,04,05,06,07,08,09,open', false),
        'door-closing': new SpriteAnimation('door', '09,08,07,05,03,02,02,02,01,00,closed', false),
        'blast-door-opening': new SpriteAnimation('blast-door', '01,02,03,04,05,06,07,08,open', false),
        'blast-door-closing': new SpriteAnimation('blast-door', '06,03,closed', false),
        'daisy-blooming': new SpriteAnimation('flower', 'b0,b1,b2,b3,db0,db1,db2,daisy', false),
        'daisy': new SpriteAnimation('flower', '2:daisy,d0,daisy,d1', true),
        'rose-blooming': new SpriteAnimation('flower', 'b0,b1,b2,b3,rb0,rb1,rb2,rose', false),
        'rose': new SpriteAnimation('flower', '2:rose,r0,rose,r1', true),
        'steam-1': new SpriteAnimation('steam-1', '00,01,02,03,04,05,06', false),
        'steam-2': new SpriteAnimation('steam-2', '00,01,02,03,04', false),
        'girl-walking-s': new SpriteAnimation('girl', '2:s,s0,s1,s,s2,s3', true),
        'girl-walking-se': new SpriteAnimation('girl', '2:se,se0,se1,se,se2,se3', true),
        'girl-walking-e': new SpriteAnimation('girl', '2:e,e0,e1,e,e2,e3', true),
        'girl-walking-ne': new SpriteAnimation('girl', '2:ne,ne0,ne1,ne,ne2,ne3', true),
        'girl-walking-n': new SpriteAnimation('girl', '2:n,n0,n1,n,n2,n3', true),
        'girl-walking-nw': new SpriteAnimation('girl', '2:nw,nw0,nw1,nw,nw2,nw3', true),
        'girl-walking-w': new SpriteAnimation('girl', '2:w,w0,w1,w,w2,w3', true),
        'girl-walking-sw': new SpriteAnimation('girl', '2:sw,sw0,sw1,sw,sw2,sw3', true),
        'girl-attacking-1': new SpriteAnimation('girl-attack-1', '00,01,02,hit,00', true),
        'girl-attacking-2': new SpriteAnimation('girl-attack-2', '00,01,02,hit,00', true),
        'girl-attacking-3': new SpriteAnimation('girl-attack-3', '00,01,hit,02,00', true),
        'girl-attacking-4': new SpriteAnimation('girl-attack-4', '00,01,02,03,04,hit,05,06,07,08,09,10,11,12,13,14', false),
    }

    drawSprite(context: DrawContext, key: string, location: Coords) {

        const sprite = this.getSprite(key);
        if (sprite == null) {
            return;
        }

        if (!context.isVisible(new Rect(location.x, location.y, sprite.rect.width, sprite.rect.height))) {
            return;
        }

        const drawLoc = context.translate(location);

        
        context.canvas.drawImage(SpriteService._sprites, 
            sprite.rect.x, sprite.rect.y, sprite.rect.width, sprite.rect.height,
            drawLoc.x, drawLoc.y, sprite.rect.width, sprite.rect.height);
    }

    public getSprite(key: string): SpriteInfo {
        if (key == null) {
            return null;
        }

        const keyParts = key.split(':');
        if (!SpriteService._categories[keyParts[0]] || !SpriteService._categories[keyParts[0]].frames[keyParts[1]]) {
            return null;
        }

        const category = SpriteService._categories[keyParts[0]];
        const frame = category.frames[keyParts[1]];

        return {
            name: key,
            rect: new Rect(frame.x, frame.y, category.width, category.height)
        };
    }

    public getAnimator(key: string): ArrayAnimator<string> {
        if (SpriteService._animations[key]) {
            return SpriteService._animations[key].toAnimator();
        }

        return null;
    }
}

export class SpriteInfo {
    name: string;
    rect: Rect;
}