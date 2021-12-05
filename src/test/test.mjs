import opentype from 'opentype.js'

import { load } from 'opentype.js'

import Canvas from 'canvas'
import fs from 'fs'
import intersect from 'path-intersection'

var text = process.argv[2]
var font_path = process.argv[3]

var color_list = [
    [255, 0, 0],
    [127, 127, 0],
    [0, 255, 0],
    [0, 127, 127],
    [0, 0, 255],
    [127, 0, 127],
    [127, 0, 0],
    [63, 63, 0],
    [0, 127, 0],
    [0, 63, 63],
    [0, 0, 127],
    [63, 0, 63],
]

var cur_color = 0
function nextColor() {
    let color = color_list[cur_color++]
    console.log(color)
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
}

function newPath() {
    let path = new opentype.Path()
    path.fill = `rgb(0, 0, 0)`
    return path
}

function toSVG(path) {
    return path.commands.map(function(v) { return [v.type, v.x, v.y].join(' '); }).join(' ')
}

function merge_subpath(subpath_list) {
    // Setting up disjoint set
    for (let i in subpath_list) {
        subpath_list[i].parent = i
    }
    function find(x) {
        if (subpath_list[x].parent == x)
            return x
        return subpath_list[x].parent = find(subpath_list[x].parent)
    }
    function union(x, y) {
        if (find(x) === find(y))
            return
        subpath_list[find(y)].commands.push(...subpath_list[find(x)].commands)
        subpath_list[find(x)].commands = []
        subpath_list[find(x)].parent = find(y)
    }

    for (let i in subpath_list) {
        for (let j in subpath_list) {
            if (j <=i)
                continue
            if (intersect(toSVG(subpath_list[i]), toSVG(subpath_list[j])).length > 0) {
                console.log(i, j)
                union(i, j)
            }
        }
    }

    subpath_list = subpath_list.filter(subpath => subpath.commands.length > 0)
    
    return subpath_list
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
            subpath.fill = `rgba(0, 0, 0)`
        }
    }
    return merge_subpath(subpath_list)
}

opentype.load(font_path, function(err, font) {
    if (err) {
        console.log('Font could not be loaded: ' + err);
    } else {
        const path = font.getPath(text, 0, 72, 72);
        const canvas = Canvas.createCanvas(300, 300);
        const ctx = canvas.getContext("2d");
        for (let subpath of splitPath(path)) {
            console.log(subpath)
            subpath.fill = nextColor()
            subpath.draw(ctx)
        }
        for (let i = 0; i < color_list.length; i++) {
            let color = color_list[i]
            ctx.font='bold 20px serif'
            ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
            ctx.fillText(i.toString(), i*25, 150)
            console.log(i.toString(), i*10, 90)
        }
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync("./image.png", buffer);
    }
});
