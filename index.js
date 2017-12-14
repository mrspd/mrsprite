let images = require('images'),
    fs = require('fs'),
    path = require('path'),
    imagemin = require('imagemin'),
    imageminPngquant = require('imagemin-pngquant');


class Mrsprite {
    constructor(imagePath, mode, output, episode, minimize) {
        this.imagePath = imagePath;
        this.mode = mode;
        this.output = output;
        this.episode = episode;
        this.minimize = minimize;
    }

    makeSprite(dirpath) {
        let files = fs.readdirSync(dirpath),
            x = 0,
            imageList = files.filter((file) => {
                try {
                    images(path.resolve(dirpath, file));
                    return true;
                } catch (e) {
                    return false;
                }
            });

        if(!imageList.length) return false;

        images.setLimit(30000, 30000);

        let tplImage = images(path.resolve(dirpath, imageList[0])),
            blank = images(tplImage.width() * imageList.length, tplImage.height());

        imageList.forEach((file) => {
            // Read only images
            let image = images(path.resolve(dirpath, file));
            blank.draw(image, x, 0);
            x += image.width();
        });

        return {
            image: blank,
            frameWidth: tplImage.width(),
            frameHeight: tplImage.height(),
            frameCount: imageList.length
        };
    }

    makeMultipleSprites(dirpath) {
        let files = fs.readdirSync(dirpath),
            sprites = [];

        files.forEach((file) => {
            let subDirPath = path.resolve(dirpath, file);

            if(fs.lstatSync(subDirPath).isDirectory()) {
                let sprite = this.makeSprite(subDirPath);

                if(sprite) {
                    sprites.push({
                        name: path.basename(subDirPath) + '.png',
                        image: sprite.image,
                        frameWidth: sprite.frameWidth,
                        frameHeight: sprite.frameHeight,
                        frameCount: sprite.frameCount
                    });
                }
            }
        });

        return sprites;
    }

    makeJoinedSprites(dirpath) {
        let sprites = this.makeMultipleSprites(dirpath),
            width = 0,
            height = 0,
            y = 0;

        sprites.forEach((sprite) => {
            if(sprite.image.width() > width) width = sprite.image.width();
            height += sprite.image.height();
        });


        if(width === 0 || height === 0) {
            console.log('Images not found');
            process.exit();
        }

        let blank = images(width, height);
        sprites.forEach((sprite) => {
            blank.draw(sprite.image, 0, y);

            sprite['y'] = y;
            sprite['width'] = sprite.image.width();

            y += sprite.image.height();
        });

        return {
            image: blank,
            sprites
        };
    }

    makeCssJoined(config, epNum) {
        let selectors = [],
            strings = [];

        strings.push(`.map${epNum} {`);
        strings.push(`\tbackground: url('https://power.z-media.info/social/islandimages/bg-map-${epNum}.png') 0 0;`);
        strings.push(`}`);
        selectors.push(strings.join("\n"));

        config.forEach((object) => {
            let strings = [],
                name = path.basename(object.name, '.png'),
                frames = object.frameCount,
                animationTime = Math.round(frames / 24 * 1000) / 1000;

            strings.push(`/** ${name} **/`);

            strings.push(`.map${epNum} .map-object-${epNum}-${name} {`);
                strings.push(`\tposition: absolute;`);
                strings.push(`\tleft: 0px;`);
                strings.push(`\ttop: 0px;`);
                strings.push(`\twidth: ${object.frameWidth}px;`);
                strings.push(`\theight: ${object.frameHeight}px;`);
                strings.push(`\tbackground: url("s/images/maps/content-map-${epNum}.png") 0 ${object.y * -1}px;`);
                strings.push(`\tanimation: map-object-${epNum}-${name} ${animationTime}s steps(${frames}) infinite;`);
            strings.push(`}\n`);

            strings.push(`@keyframes map-object-${epNum}-${name} {`);
                strings.push(`\tfrom {`);
                strings.push(`\tbackground-position: 0 ${object.y * -1}px`);
                strings.push(`\t}`);
                strings.push(`\tto {`);
                strings.push(`\tbackground-position: ${object.width * -1}px ${object.y * -1}px`);
                strings.push(`\t}`);
            strings.push(`}`);

            selectors.push(strings.join("\n"));
        });

        return selectors.join("\n\n");
    }

    makeCssMultiple(config, epNum) {
        let selectors = [];

        config.forEach((object) => {
            let strings = [],
                name = path.basename(object.name, '.png'),
                frames = object.frameCount,
                animationTime = Math.round(frames / 24 * 1000) / 1000;

            strings.push(`/** ${name} **/`);

            strings.push(`&.${name} {`);
            strings.push(`\tposition: absolute;`);
            strings.push(`\tleft: 0px;`);
            strings.push(`\ttop: 0px;`);
            strings.push(`\twidth: ${object.frameWidth}px;`);
            strings.push(`\theight: ${object.frameHeight}px;`);
            strings.push(`\tbackground: url("@{imagesPath}/${name}.png") 0 0 no-repeat;`);
            strings.push(`\tanimation: global-cycle-animation ${animationTime}s steps(${frames - 1}) infinite;`);
            strings.push(`}\n`);

            selectors.push(strings.join("\n"));
        });

        return selectors.join("\n\n");
    }

    make() {
        let outputPath = this.output;
        if(!outputPath) outputPath = path.resolve(process.cwd());

        console.log('Creating...');
        console.log(`Mode: ${this.mode}`);

        switch (this.mode) {
            case 'multiple':
                let sprites = [];
                this.makeMultipleSprites(this.imagePath).forEach((sprite) => {
                    sprites.push(sprite);
                    sprite.image.save(path.join(outputPath, sprite.name));
                });

                if(this.episode) {
                    let css = this.makeCssMultiple(sprites, this.episode);
                    fs.writeFileSync(path.join(outputPath, this.episode + '.scss'), css);
                }
                break;

            case 'joined':
                let joinedSprite = this.makeJoinedSprites(this.imagePath);
                joinedSprite.image.save(path.join(outputPath, path.basename(this.imagePath)) + '.png');

                if(this.episode) {
                    let css = this.makeCssJoined(joinedSprite.sprites, this.episode);
                    fs.writeFileSync(path.join(outputPath, this.episode + '.css'), css);
                }
                break;

            case 'single':
                let singleSprite = this.makeSprite(this.imagePath);
                singleSprite.image.save(path.join(outputPath, path.basename(this.imagePath)) + '.png');
                break;
        }

        console.log('Spritesheet created...');

        /*if(this.minimize) {
            imagemin(['*.png'], 'optimized', {
                plugins: [
                    imageminPngquant({
                        quality: 78,
                        speed: 5,
                        verbose: true,
                        nofs: true,
                        floyd: 1,
                        posterize: 10

                    })
                ]
            }).then(files => {
                console.log('Spritesheet optimized...');
            });
        }*/
    }
}

module.exports = Mrsprite;