

/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

const fs = require("fs");
const fileNames = ['react-toolbox/lib/dropdown/Dropdown.js','react-toolbox/lib/link/Link.js', 'storm-react-diagrams/dist/main.js',
    'storm-react-diagrams/dist/main.js.map', 'storm-react-diagrams/dist/style.min.css', 'react-json-view/dist/main.js'];


/**
 * integration of the modules that have own modifications
 */
function integrateLibs() {
    console.log('Start integrating libs ...');
    for (let i = 0; i < fileNames.length; i++) {
        let libPath = './libs/' + fileNames[i];
        if (fs.existsSync(libPath)) {
            let nodeModulePath = './node_modules/' + fileNames[i];
            let content = fs.readFileSync(libPath, 'utf-8');
            if(fs.existsSync(nodeModulePath)) {
                fs.unlinkSync(nodeModulePath, function (err) {
                    if (err) console.log(err);
                    console.log(nodeModulePath + ' was deleted');
                });
            } else{
                console.log('File with such name "' + nodeModulePath +'" does NOT exist');
            }
            fs.appendFileSync(nodeModulePath, content.toString(), function (err) {
                if (err) console.log(err);
                console.log(nodeModulePath + ' was created');
            });
            console.log(nodeModulePath + ' DONE');
        } else {
            console.log('File with such name "' + libPath + '" does NOT exist');
        }
    }
    console.log('Finish integration.');
}


module.exports = integrateLibs;