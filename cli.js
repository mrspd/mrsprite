#! /usr/bin/env node

let Mrsprite = require('./index.js'),
    argsParser = require('parse-cli-arguments'),
    path = require('path');

const argsConfiguration = {
    options: {
        imagePath: {
            flag: true,
            alias: 'i',
            defaultValue: process.cwd(),
            transform: (value) => {
                if(path.isAbsolute(value)) return value;
                return path.resolve(value);
            }
        },
        mode: {
            flag: true,
            alias: 'm',
            defaultValue: 'joined', // joined / multiple / single
        },
        output: {
            flag: true,
            alias: 'o',
            transform: (value) => {
                if(path.isAbsolute(value)) return value;
                return path.resolve(value);
            }
        }
    }
};


let args = argsParser(argsConfiguration);
let mrsprite = new Mrsprite(args.imagePath, args.mode, args.output);

mrsprite.make();