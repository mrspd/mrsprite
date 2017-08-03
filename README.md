## Mrsprite
Spritesheet generator with build-in vertical joiner.

##Usage
`npm i -g mrsprite`

Utility have next arguments

`-m` - mode \[joined, multiple, single\] - how to make spritesheets. 

* **Joined** - Make sprites from subdirectories and join them in one file

* **Multiple** - Make sprites from subdirectories but save each sprite separately

* **Single** - Make sprite from images inside specified directory

`-i` - Directory where scan images for spritesheet generation

`-o` - Output folder for save sprites

##Example
`mrsprite -i ./animations/ -m joined -o ~/mysprites/`


