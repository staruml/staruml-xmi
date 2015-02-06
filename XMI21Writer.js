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

    var IdGenerator       = app.getModule("core/IdGenerator"),
        Repository        = app.getModule("core/Repository"),
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
        this.indentString = indentString || "\t"; // default tab

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
        this.indentations.splice(this.indentations.length - 1, 1);
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
     * Map for Enumeration Writers
     */
    var enumerations = {};

    /**
     * Map for Element Writers
     */
    var elements = {};

    function addTo(json, name, value) {
        if (!Array.isArray(json[name])) {
            json[name] = [];
        }
        json[name].push(value);
    }

    function appendTo(json, name, elements) {
        if (!Array.isArray(json[name])) {
            json[name] = [];
        }
        var arr = json[name];
        _.each(elements, function (elem) {
            if (!_.contains(arr, elem) && !_.some(arr, function (item) { return item._id === elem._id; })) {
                arr.push(elem);
            }
        });
    }

    /**
     * Set xmi:type
     * @param {object} json
     * @param {string} typeName
     */
    function setType(json, typeName) {
        json['xmi:type'] = typeName;
    }

    /**
     * Write a string value as an attribute
     * @param {object} json
     * @param {string} name
     * @param {string} value
     */
    function writeString(json, name, value) {
        json[name] = value;
    }

    /**
     * Write a boolean value as an attribute
     * @param {object} json
     * @param {string} name
     * @param {boolean} value
     */
    function writeBoolean(json, name, value) {
        if (value) {
            json[name] = "true";
        } else {
            json[name] = "false";
        }
    }

    /**
     * Write enumeration
     * @param {object} json
     * @param {string} name
     * @param {?} value
     */
    function writeEnum(json, name, type, value) {
        var fun = enumerations[type];
        if (fun) {
            json[name] = fun(value);
        }
    }

    /**
     * Write an array of elements
     * @param {object} json
     * @param {string} name
     * @param {Array.<Element>} value
     */
    function writeElementArray(json, name, elems) {
        _.each(elems, function (elem) {
            var fun = elements[elem.getClassName()];
            if (fun) {
                var node = fun(elem);
                addTo(json, name, node);
            }
        });
    }

    /**
     * Write a value specification
     * @param {object} json
     * @param {string} name
     * @param {string} valueType
     * @param {boolean} value
     */
    function writeValueSpec(json, name, valueType, value) {
        json[name] = {
            "xmi:id"   : IdGenerator.generateGuid(),
            "xmi:type" : valueType,
            "value"    : value
        };
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
                _.each(val, function (item) {
                    convertJsonToXML(item, xmlWriter, key);
                });
            } else if (_.isObject(val)) {
                convertJsonToXML(val, xmlWriter, key);
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
        var result = new $.Deferred();
        try {
            // Build intermediate JSON representations
            var project = ProjectManager.getProject();
            var root = {
                    "xmi:id"          : IdGenerator.generateGuid(),
                    "xmi:type"        : "uml:Model",
                    "name"            : "RootModel",
                    "packagedElement" : []
                };
            writeElementArray(root, "packagedElement", project.ownedElements);

            // Convert to XML
            var xmlWriter = new XMLWriter();
            xmlWriter.writeLine('<?xml version="1.0" encoding="UTF-8"?>');
            xmlWriter.writeLine('<xmi:XMI xmi:version="2.1" xmlns:uml="http://schema.omg.org/spec/UML/2.0" xmlns:xmi="http://schema.omg.org/spec/XMI/2.1">');
            xmlWriter.indent();
            convertJsonToXML(root, xmlWriter);
            xmlWriter.outdent();
            xmlWriter.writeLine('</xmi:XMI>');

            // Save to File
            var file = FileSystem.getFileForPath(filename);
            FileUtils.writeText(file, xmlWriter.getData(), true)
                .done(function () {
                    result.resolve(filename);
                })
                .fail(function (err) {
                    result.reject(err);
                });
        } catch (err) {
            result.reject(err);
        }
        return result.promise();
    }

    exports.enumerations      = enumerations;
    exports.elements          = elements;

    exports.setType           = setType;
    exports.writeString       = writeString;
    exports.writeBoolean      = writeBoolean;
    exports.writeEnum         = writeEnum;
    exports.writeElementArray = writeElementArray;
    exports.writeValueSpec    = writeValueSpec;

    exports.saveToFile        = saveToFile;

});
