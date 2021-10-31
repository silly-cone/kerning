import opentype from 'opentype.js'

import { load } from 'opentype.js'

import Canvas from 'canvas'
import fs from 'fs'

var text = process.argv[2]
var font_path = process.argv[3]

function randomColor() {
    let r = Math.floor(Math.random() * 256)
    let g = Math.floor(Math.random() * 256)
    let b = Math.floor(Math.random() * 256)
    return `rgb(${r}, ${g}, ${b})`
}

function newPath() {
    let path = new opentype.Path()
    path.fill = randomColor()
    return path
}

function splitPath(path) {
    let subpath_list = []
    let subpath = newPath()
    subpath.commands = []
    for (let cmd of path.commands) {
        subpath.commands.push(cmd)
        if (cmd.type === 'Z') {
            subpath_list.push(subpath)
            subpath = newPath()
            subpath.commands = []
            subpath.fill = randomColor()
        }
    }
    return subpath_list
}

opentype.load(font_path, function(err, font) {
    if (err) {
        console.log('Font could not be loaded: ' + err);
    } else {
        const path = font.getPath(text, 0, 72, 72);
        const canvas = Canvas.createCanvas(150, 150);
        const ctx = canvas.getContext("2d");
        for (let subpath of splitPath(path)) {
            subpath.draw(ctx)
        }
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync("./image.png", buffer);
    }
});
