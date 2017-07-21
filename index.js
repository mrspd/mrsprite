let images = require('images'),
    fs = require('fs'),
    path = require('path');

class Mrsprite {
    constructor(imagePath, mode, output) {
        this.imagePath = imagePath;
        this.mode = mode;
        this.output = output;
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

        let tplImage = images(path.resolve(dirpath, imageList[0])),
            blank = images(tplImage.width() * imageList.length, tplImage.height());

        imageList.forEach((file) => {
            // Read only images
            let image = images(path.resolve(dirpath, file));
            blank.draw(image, x, 0);
            x += image.width();
        });

        return blank;
    }

    makeMultipleSprites(dirpath) {
        let files = fs.readdirSync(dirpath),
            sprites = [];

        files.forEach((file) => {
            let subDirPath = path.resolve(dirpath, file);

            if(fs.lstatSync(subDirPath).isDirectory()) {
                let sprite = this.makeSprite(subDirPath);

                if(sprite) {
                    sprites.push({name: path.basename(subDirPath) + '.png', image: sprite});
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
            y += sprite.image.height();
        });

        return blank;
    }

    make() {
        let outputPath = this.output;
        if(!outputPath) outputPath = path.resolve(process.cwd());

        switch (this.mode) {
            case 'multiple':
                this.makeMultipleSprites(this.imagePath).forEach((sprite) => {
                    sprite.image.save(path.join(outputPath, sprite.name));
                });
                break;

            case 'joined':
                this.makeJoinedSprites(this.imagePath).save(path.join(outputPath, path.basename(this.imagePath)) + '.png');
                break;

            case 'single':
                this.makeSprite(this.imagePath).save(path.join(outputPath, path.basename(this.imagePath)) + '.png');
                break;
        }
    }
}

module.exports = Mrsprite;