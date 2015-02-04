/*
 * Copyright (c) 2014 MKLab. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, browser: true, sub:true */
/*global $, _, define, app, type, DOMParser */

define(function (require, exports, module) {
    "use strict";

    var Repository        = app.getModule("core/Repository"),
        FileUtils         = app.getModule("file/FileUtils"),
        FileSystem        = app.getModule("filesystem/FileSystem"),
        ProjectManager    = app.getModule("engine/ProjectManager");


    /**
     * XMLWriter
     * @constructor
     */
    function XMLWriter(indentString) {

        /** @member {Array.<string>} lines */
        this.lines = [];

        /** @member {string} indentString */
        this.indentString = (indentString ? indentString : "\t"); // default tab

        /** @member {Array.<string>} indentations */
        this.indentations = [];
    }

    /**
     * Indent
     */
    XMLWriter.prototype.indent = function () {
        this.indentations.push(this.indentString);
    };

    /**
     * Outdent
     */
    XMLWriter.prototype.outdent = function () {
        this.indentations.splice(this.indentations.length-1, 1);
    };

    /**
     * Write a line
     * @param {string} line
     */
    XMLWriter.prototype.writeLine = function (line) {
        if (line) {
            this.lines.push(this.indentations.join("") + line);
        } else {
            this.lines.push("");
        }
    };

    /**
     * Return as all string data
     * @return {string}
     */
    XMLWriter.prototype.getData = function () {
        return this.lines.join("\n");
    };


    /**
     * Map for Element Readers
     */
    var elements = {};

    /**
     * Set xmi:type
     * @param {object} json
     * @param {string} typeName
     */
    function setType(json, typeName) {
        json['xmi:type'] = typeName;
    }

    /**
     * Write string value as an attribute
     * @param {object} json
     * @param {string} name
     * @param {?} value
     */
    function writeString(json, name, value) {
        json[name] = value;
    }


    function addTo(json, name, value) {
        if (!Array.isArray(json[name])) {
            json[name] = [];
        }
        json[name].push(value);
    }

    function convertJsonToXML(json, xmlWriter, tagName) {
        tagName = tagName || json['xmi:type'];

        var line = '<' + tagName;

        // Convert attributes
        _.each(json, function (val, key) {
            if (!_.isObject(val)) {
                line += ' ' + key + '="' + val + '"';
            }
        });
        line += '>';
        xmlWriter.writeLine(line);
        xmlWriter.indent();

        // Convert children
        _.each(json, function (val, key) {
            if (_.isArray(val)) {

            } else if (_.isObject(val)) {

            }
        });

        xmlWriter.outdent();
        xmlWriter.writeLine('</' + tagName + '>');
    }


    /**
     * Save to file
     *
     * @param {string} filename
     * @return {$.Promise}
     */
    function saveToFile(filename) {
        var project = ProjectManager.getProject(),
            roots   = [];

        // Build intermediate JSON representations
        _.each(project.ownedElements, function (elem) {
            if (elements[elem.getClassName()]) {
                var json = elements[elem.getClassName()](elem);
                roots.push(json);
            }
        });

        // Convert to XML
        var xmlWriter = new XMLWriter();
        xmlWriter.writeLine('<?xml version="1.0" encoding="UTF-8"?>');
        xmlWriter.writeLine('<xmi:XMI xmi:version="2.1" xmlns:uml="http://schema.omg.org/spec/UML/2.0" xmlns:xmi="http://schema.omg.org/spec/XMI/2.1">');
        xmlWriter.indent();
        _.each(roots, function (root) {
            convertJsonToXML(root, xmlWriter);
        });
        xmlWriter.outdent();
        xmlWriter.writeLine('</xmi:XMI>');


        console.log(xmlWriter.getData());
    }

    exports.elements = elements;

    exports.setType     = setType;
    exports.writeString = writeString;

    exports.saveToFile  = saveToFile;

});
