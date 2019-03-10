import { Coords, Rect } from "../locators";
import { DrawContext } from "./game-loop-service";
import { ArrayAnimator } from "../animators";

class SpriteCategory {
    width: number;
    height: number;
    frames: {[key: string]: SpriteFrame}

    constructor(
        xStart: number, yStart: number, 
        width: number, height: number, 
        spriteSheetWidth: number,
        frames: string) {
    
        let x = xStart;
        let y = yStart;
        const framesDictionary: {[key: string]: SpriteFrame} = {};
        for(const name of frames.split(',')) {
            if (x + width > spriteSheetWidth) {
                x = 0;
                y += height;
            }
    
            framesDictionary[name] = new SpriteFrame(x,y);
            x += width;
        }

        this.width = width;
        this.height = height;
        this.frames = framesDictionary;
    }

    mergeWith(cat2: SpriteCategory): SpriteCategory {
        for (const key of Object.keys(cat2.frames)) {
            this.frames[key] = cat2.frames[key];
        }

        return this;
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
        img.src = '8eef08f3b190751049e4b73568de3ac4.png';
        return img;
    })();

    private static _categories: {[key: string]: SpriteCategory} = {
        'girl': new SpriteCategory(0,0,32,32,256,
            [
                's0,s1,s,s2,s3', 'se0,se1,se,se2,se3',
                'e0,e1,e,e2,e3', 'ne0,ne1,ne,ne2,ne3',
                'n0,n1,n,n2,n3', 'nw0,nw1,nw,nw2,nw3',
                'w0,w1,w,w2,w3', 'sw0,sw1,sw,sw2,sw3'
            ].join(',')),
        'girl-attack-1': new SpriteCategory(0,160,64,32,256,'00,01,02,hit'),
        'girl-attack-2': new SpriteCategory(0,192,32,48,256,'00,01,02,hit'),
        'flower': 
            new SpriteCategory(128,192,16,32,256,'b0,b1,b2,b3,db0,db1,db2,daisy').mergeWith(
            new SpriteCategory(0,240,16,32,256,[
                'd0,d1', 'daisy-dead,daisy-dead-float',
                'rb0,rb1,rb2,rose,r0,r1', 'rose-dead,rose-dead-float'
            ].join(','))),
        'steam-1': 
            new SpriteCategory(192,240,20,20,256,'00,01,02').mergeWith(
            new SpriteCategory(0,272,20,20,256,'03,04,05,06')),
        'steam-2': new SpriteCategory(80,272,32,20,256,'00,01,02,03,04'),
        'blast-door': new SpriteCategory(0,292,48,24,256,'closed,01,02,03,04,05,06,07,08,open'),
        'door': new SpriteCategory(0,340,52,54,256,'closed,00,01,02,03,04,05,06,07,08,09,open'),
        'poop': new SpriteCategory(0,502,86,77,256,'00'),
        'room': new SpriteCategory(86,502,37,25,256,'00'),
        'glimmer-m': new SpriteCategory(123,502,13,21,256,'00'),
        'glimmer-s': new SpriteCategory(136,502,7,13,256,'00'),
    }

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