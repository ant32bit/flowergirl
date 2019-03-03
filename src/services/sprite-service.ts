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
        for(const name in frames.split(',')) {
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
        this.frames = frames.split(',').map(x => [category, x].join(':'));
    }
}

export class SpriteService {
    private static _spritesFile = '8ffee8c7516d79fc215f81cc47b54126.png';
    private static _categories: {[key: string]: SpriteCategory} = {
        'door': new SpriteCategory(0,0,32,32,128,'closed,o0,o1,o2,o3,o4,o5,o6,o7,o8,o9,open,c1,c2'),
        'flower': new SpriteCategory(64,96,16,32,128,
            [
                'b0,b1,b2,b3', 
                'd0,d1,d2,daisy', 'daisy-dead,daisy-dead-float',
                'r0,r1,r2,rose', 'rose-dead,rose-dead-float'
            ].join(',')),
        'girl': new SpriteCategory(64,160,32,32,128,
            [
                's,s0,s1,s2,s3', 'se,se0,se1,se2,se3',
                'e,e0,e1,e2,e3', 'ne,ne0,ne1,ne2,ne3',
                'n,n0,n1,n2,n3', 'nw,nw0,nw1,nw2,nw3',
                'w,w0,w1,w2,w3', 'sw,sw0,sw1,sw2,sw3'
            ].join(',')),
        'girl-attack-1': new SpriteCategory(64,480,64,32,128,'00,01,02,03'),
        'glimmer-m': new SpriteCategory(64,544,16,24,128,'m'),
        'glimmer-s': new SpriteCategory(80,544,8,16,128,'s'),
        'poop': new SpriteCategory(0,576,88,88,128,'00')
    }

    private static _animations: {[key: string]: SpriteAnimation} = {
        'door-opening': new SpriteAnimation('door', 'o0,o1,o2,o3,o4,o5,o6,o7,o8,o9,open', false),
        'door-closing': new SpriteAnimation('door', 'c1,c2,c2,o2,o1,closed', false),
        'daisy-blooming': new SpriteAnimation('flower', 'b0,b1,b2,b3,d0,d1,d2,daisy', false),
        'rose-blooming': new SpriteAnimation('flower', 'b0,b1,b2,b3,r0,r1,r2,rose', false),
        'girl-walking-s': new SpriteAnimation('girl', 's,s0,s1,s,s2,s3', true),
        'girl-walking-se': new SpriteAnimation('girl', 'se,se0,se1,se,se2,se3', true),
        'girl-walking-e': new SpriteAnimation('girl', 's,s0,s1,s,s2,s3', true),
        'girl-walking-ne': new SpriteAnimation('girl', 'ne,ne0,ne1,ne,ne2,ne3', true),
        'girl-walking-n': new SpriteAnimation('girl', 'n,n0,n1,n,n2,n3', true),
        'girl-walking-nw': new SpriteAnimation('girl', 'nw,nw0,nw1,nw,nw2,nw3', true),
        'girl-walking-w': new SpriteAnimation('girl', 'w,w0,w1,w,w2,w3', true),
        'girl-walking-sw': new SpriteAnimation('girl', 'sw,sw0,sw1,sw,sw2,sw3', true),
        'girl-attacking-1': new SpriteAnimation('girl-attack-1', '00,01,02,03,00', false),
    }
}

export class SpriteInfo {
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
}