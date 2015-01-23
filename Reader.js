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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, browser: true */
/*global $, _, define, app, type, DOMParser */

define(function (require, exports, module) {
    "use strict";

    /**
     * XML Node Types
     * @enum {number}
     */
    var ELEMENT_NODE                = 1,
        ATTRIBUTE_NODE              = 2,
        TEXT_NODE                   = 3,
        CDATA_SECTION_NODE          = 4,
        ENTITY_REFERENCE_NODE       = 5,
        ENTITY_NODE                 = 6,
        PROCESSING_INSTRUCTION_NODE = 7,
        COMMENT_NODE                = 8,
        DOCUMENT_NODE               = 9,
        DOCUMENT_TYPE_NODE          = 10,
        DOCUMENT_FRAGMENT_NODE      = 11,
        NOTATION_NODE               = 12;

    /**
     * Object Readers
     * @type {Object<string,function (obj:XMLNode)>}
     */
    var objectReaders = {};

    /**
     * Object Id Map
     * @type {Object<string,Object>}
     */
    var idMap = {};

    /**
     * Enumerations
     * @type {Object<string,Object<string,?>}
     */
    var enumerations = {};

    /**
     * Post Processors
     * @type {Array.<function(Element)>}
     */
    var postprocessors = [];

    /**
     * Read ATTR tag value at OBJ node
     * @param {XMLNode} objNode
     * @param {string} name
     * @param {?} defaultValue
     * @return {number|boolean|string|null} value of the attr
     */
    function readAttr(objNode, name, defaultValue) {
        var i, len;
        for (i = 0, len = objNode.childNodes.length; i < len; i++) {
            var child = objNode.childNodes[i];
            if (child.nodeType === ELEMENT_NODE && child.localName === "ATTR" && child.getAttribute("name") === name) {
                var type = child.getAttribute("type");
                switch (type) {
                case "string":
                    return child.childNodes[0].nodeValue;
                case "integer":
                    return parseInt(child.childNodes[0].nodeValue, 10);
                case "real":
                    return parseFloat(child.childNodes[0].nodeValue);
                case "boolean":
                    return (child.childNodes[0].nodeValue.toLowerCase() === "true" ? true : false);
                case "Points":
                    return child.childNodes[0].nodeValue.replace(/,/g, ":");
                }
            }
        }
        if (typeof defaultValue !== "undefined") {
            return defaultValue;
        }
        return null;
    }

    /**
     * Read ATTR tag value of an enumeration type at OBJ node
     * @param {XMLNode} objNode
     * @param {string} name
     * @param {?} defaultValue
     * @return {number|string|null} value of enumeration literal
     */
    function readEnum(objNode, name, defaultValue) {
        var i, len;
        for (i = 0, len = objNode.childNodes.length; i < len; i++) {
            var child = objNode.childNodes[i];
            if (child.nodeType === ELEMENT_NODE && child.localName === "ATTR" && child.getAttribute("name") === name) {
                var type = child.getAttribute("type");
                if (enumerations[type]) {
                    var literal = child.childNodes[0].nodeValue;
                    if (typeof enumerations[type][literal] !== "undefined") {
                        return enumerations[type][literal];
                    }
                }
            }
        }
        if (typeof defaultValue !== "undefined") {
            return defaultValue;
        }
        return null;
    }

    /**
     * Read REF tag value at OBJ node
     * @param {XMLNode} objNode
     * @param {string} name
     * @param {?} defaultValue
     * @return {{$ref:string}}
     */
    function readRef(objNode, name, defaultValue) {
        var i, len;
        for (i = 0, len = objNode.childNodes.length; i < len; i++) {
            var child = objNode.childNodes[i];
            if (child.nodeType === ELEMENT_NODE && child.localName === "REF" && child.getAttribute("name") === name) {
                return { $ref: child.childNodes[0].nodeValue };
            }
        }
        if (typeof defaultValue !== "undefined") {
            return defaultValue;
        }
        return null;
    }

    /**
     * Read OBJ tag value at OBJ node
     * @param {XMLNode} objNode
     * @param {string} name
     * @param {?} defaultValue
     * @return {Object} converted js object
     */
    function readObj(objNode, name, defaultValue) {
        var i, len, parentId = objNode.getAttribute("guid");
        for (i = 0, len = objNode.childNodes.length; i < len; i++) {
            var child = objNode.childNodes[i];
            if (child.nodeType === ELEMENT_NODE && child.localName === "OBJ" && child.getAttribute("name") === name) {
                var type = child.getAttribute("type"),
                    guid = child.getAttribute("guid");
                if (objectReaders[type]) {
                    var reader = objectReaders[type];
                    var json = reader(child);
                    if (!json._type) {
                        json._type = type;
                    }
                    if (!json._id) {
                        json._id = guid;
                    }
                    if (!json._parent) {
                        json._parent = { "$ref": parentId };
                    }
                    idMap[json._id] = json;
                    return json;
                }
            }
        }
        if (typeof defaultValue !== "undefined") {
            return defaultValue;
        }
        return null;
    }

    /**
     * Read OBJ(array) tags value at OBJ node
     * @param {XMLNode} objNode
     * @param {string} name
     * @return {Array.<Object>} converted array of js objects
     */
    function readObjArray(objNode, name) {
        var i, len;
        for (i = 0, len = objNode.childNodes.length; i < len; i++) {
            var child = objNode.childNodes[i];
            if (child.nodeType === ELEMENT_NODE && child.localName === "ATTR" && child.getAttribute("name") === "#" + name) {
                var size = readAttr(objNode, "#" + name);
                var j, jsonArray = [];
                for (j = 0; j < size; j++) {
                    var item = readObj(objNode, name + "[" + j + "]");
                    if (item) {
                        jsonArray.push(item);
                    }
                }
                return jsonArray;
            }
        }
        return [];
    }

    /**
     * Read REF(array) tags value at OBJ node
     * @param {XMLNode} objNode
     * @param {string} name
     * @return {Array.<Object>} converted array of js objects
     */
    function readRefArray(objNode, name) {
        var i, len;
        for (i = 0, len = objNode.childNodes.length; i < len; i++) {
            var child = objNode.childNodes[i];
            if (child.nodeType === ELEMENT_NODE && child.localName === "ATTR" && child.getAttribute("name") === "#" + name) {
                var size = readAttr(objNode, "#" + name);
                var j, jsonArray = [];
                for (j = 0; j < size; j++) {
                    var item = readRef(objNode, name + "[" + j + "]");
                    if (item) {
                        jsonArray.push(item);
                    }
                }
                return jsonArray;
            }
        }
        return [];
    }

    /**
     * Read color value at OBJ node
     * @param {XMLNode} objNode
     * @param {string} name
     * @param {?} defaultValue
     * @return {string} converted color value
     */
    function readColor(objNode, name, defaultValue) {
        var i, len;
        for (i = 0, len = objNode.childNodes.length; i < len; i++) {
            var child = objNode.childNodes[i];
            if (child.nodeType === ELEMENT_NODE && child.localName === "ATTR" && child.getAttribute("name") === name) {
                var value = child.childNodes[0].nodeValue;
                if (value.substr(0, 2) === "cl") {
                    switch (value) {
                    case "clNone":
                        value = "$1FFFFFFF";
                        break;
                    case "clAqua":
                        value = "$00FFFF00";
                        break;
                    case "clBlack":
                        value = "$00000000";
                        break;
                    case "clBlue":
                        value = "$00FF0000";
                        break;
                    case "clCream":
                        value = "$00F0FBFF";
                        break;
                    case "clDkGray":
                        value = "$00808080";
                        break;
                    case "clFuchsia":
                        value = "$00FF00FF";
                        break;
                    case "clGray":
                        value = "$00808080";
                        break;
                    case "clGreen":
                        value = "$00008000";
                        break;
                    case "clLime":
                        value = "$0000FF00";
                        break;
                    case "clLtGray":
                        value = "$00C0C0C0";
                        break;
                    case "clMaroon":
                        value = "$00000080";
                        break;
                    case "clMedGray":
                        value = "$00A4A0A0";
                        break;
                    case "clMoneyGreen":
                        value = "$00C0DCC0";
                        break;
                    case "clNavy":
                        value = "$00800000";
                        break;
                    case "clOlive":
                        value = "$00008080";
                        break;
                    case "clPurple":
                        value = "$00800080";
                        break;
                    case "clRed":
                        value = "$000000FF";
                        break;
                    case "clSilver":
                        value = "$00C0C0C0";
                        break;
                    case "clSkyBlue":
                        value = "$00F0CAA6";
                        break;
                    case "clTeal":
                        value = "$00808000";
                        break;
                    case "clWhite":
                        value = "$00FFFFFF";
                        break;
                    case "clYellow":
                        value = "$0000FFFF";
                        break;
                    }
                }
                if (value[0] === "$" && value.length === 9) {
                    var r = value[7] + value[8],
                        g = value[5] + value[6],
                        b = value[3] + value[4];
                    return "#" + r + g + b;
                }
            }
        }
        if (typeof defaultValue !== "undefined") {
            return defaultValue;
        }
        return null;
    }

    /**
     * Clear loaded elements
     */
    function clear() {
        idMap = {};
    }

    /**
     * Get Object by Id
     * @param {string} id
     * @return {Object}
     */
    function get(id) {
        return idMap[id];
    }

    /**
     * Get idMap
     * @return {Object}
     */
    function getIdMap() {
        return idMap;
    }

    /**
     * Execute All Post Processors
     */
    function postprocess() {
        var i, len;
        for (i = 0, len = postprocessors.length; i < len; i++) {
            var key, processor = postprocessors[i];
            for (key in idMap) {
                if (idMap.hasOwnProperty(key)) {
                    var elem = idMap[key];
                    processor(elem);
                }
            }
        }
    }


    exports.objectReaders  = objectReaders;
    exports.enumerations   = enumerations;
    exports.postprocessors = postprocessors;
    exports.readAttr       = readAttr;
    exports.readEnum       = readEnum;
    exports.readRef        = readRef;
    exports.readObj        = readObj;
    exports.readObjArray   = readObjArray;
    exports.readRefArray   = readRefArray;
    exports.readColor      = readColor;
    exports.clear          = clear;
    exports.get            = get;
    exports.getIdMap       = getIdMap;
    exports.postprocess    = postprocess;

});
