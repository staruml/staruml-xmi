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
        Dialogs           = app.getModule("dialogs/Dialogs"),
        FileUtils         = app.getModule("file/FileUtils"),
        FileSystem        = app.getModule("filesystem/FileSystem");

    var UML = app.getModule("uml/UML");

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
     * Map for Enumeration Readers
     */
    var enumerationReaders = {};

    /**
     * Map for Element Readers
     */
    var elementReaders = {};


    /**
     * Find child node by name
     * @private
     * @param {XMLNode} node
     * @param {string} name
     * @return {null|XMLNode}
     */
    function _findChildByName(node, name) {
        var i, len;
        for (i = 0, len = node.childNodes.length; i < len; i++) {
            var child = node.childNodes[i];
            if (child.nodeType === ELEMENT_NODE && child.nodeName === name) {
                return child;
            }
        }
        return null;
    }

    /**
     * Read attribute value of node
     * @param {XMLNode} node
     * @param {string} name
     * @param {?} defaultValue
     * @return {number|boolean|string|null} value of the attr
     */
    function readString(node, name, defaultValue) {
        var val = node.getAttribute(name);
        if (typeof val !== "undefined" && val !== null) {
            return val;
        }
        return defaultValue;
    }

    /**
     * Read boolean attribute value of node
     * @param {XMLNode} node
     * @param {string} name
     * @param {?} defaultValue
     * @return {number|boolean|string|null} value of the attr
     */
    function readBoolean(node, name, defaultValue) {
        var val = node.getAttribute(name);
        if (typeof val !== "undefined" && val !== null) {
            return (val.toLowerCase() === "true" ? true : false);
        }
        return defaultValue;
    }

    /**
     * Read enumeration attribute value of node
     * @param {XMLNode} node
     * @param {string} name
     * @param {string} type
     * @param {?} defaultValue
     * @return {number|boolean|string|null} value of the attr
     */
    function readEnum(node, name, type, defaultValue) {
        var _enum = enumerationReaders[type];
        if (_enum) {
            var val = readString(node, name);
            var literal = _enum[val];
            if (literal) {
                return literal;
            }
        }
        return defaultValue;
    }

    /**
     * Read composite elements of node
     * @param {XMLNode} node
     * @param {string} name
     * @return {Array.<Object>} converted array of js objects
     */
    function readCompositions(node, name) {
        var parentId  = readString(node, "xmi.id"),
            jsonArray = [];
        var compositeNode = _findChildByName(node, name);
        if (compositeNode) {
            var i, len;
            for (i = 0, len = compositeNode.childNodes.length; i < len; i++) {
                var child = compositeNode.childNodes[i];
                if (child.nodeType === ELEMENT_NODE) {
                    var fun = elementReaders[child.nodeName];
                    if (fun) {
                        var item = fun(child);
                        if (item) {
                            if (parentId) {
                                item._parent = { "$ref": parentId };
                            }
                            jsonArray.push(item);
                        }
                    }
                }
            }
        }
        return jsonArray;
    }

    // UML MetaModel ...........................................................

    enumerationReaders["UML:VisibilityKind"] = {
        "public"    : UML.VK_PUBLIC,
        "protected" : UML.VK_PROTECTED,
        "private"   : UML.VK_PRIVATE,
        "package"   : UML.VK_PACKAGE
    };

    enumerationReaders["UML:ParameterDirectionKind"] = {
        "in":     UML.DK_IN,
        "inout":  UML.DK_INOUT,
        "out":    UML.DK_OUT,
        "return": UML.DK_RETURN
    };

    elementReaders["Element"] = function (node) {
        var json = { tags: [] };
        json["_id"] = readString(node, "xmi.id", IdGenerator.generateGuid());
        return json;
    };

    elementReaders["UML:ModelElement"] = function (node) {
        var json = elementReaders["Element"](node);
        json["name"] = readString(node, "name", "");
        json["visibility"] = readEnum(node, "visibility", "UML:VisibilityKind", UML.VK_PUBLIC);
        readBoolean(node, "isSpecification", false);
        return json;
    };

    elementReaders["UML:Feature"] = function (node) {
        var json = elementReaders["UML:ModelElement"](node);
        var ownerScope = readString(node, "ownerScope", null);
        return json;
    };

    elementReaders["UML:Namespace"] = function (node) {
        var json = elementReaders["UML:ModelElement"](node);
        json["ownedElements"] = readCompositions(node, "UML:Namespace.ownedElement");
        return json;
    };

    elementReaders["UML:GeneralizableElement"] = function (node) {
        var json = elementReaders["UML:ModelElement"](node);
        readBoolean(node, "isRoot", false);
        json["isLeaf"] = readBoolean(node, "isLeaf", false);
        json["isAbstract"] = readBoolean(node, "isAbstract", false);
        return json;
    };

    elementReaders["UML:Parameter"] = function (node) {
        var json = elementReaders["UML:ModelElement"](node);
        json["_type"] = "UMLParameter";
        json["defaultValue"] = readString(node, "defaultValue", "");
        json["direction"] = readEnum(node, "kind", "UML:ParameterDirectionKind", false);
        return json;
    };

    elementReaders["UML:StructuralFeature"] = function (node) {
        var json = elementReaders["UML:Feature"](node);
        json["multiplicity"] = readString(node, "multiplicity", "");
        // changeability
        // targetScope
        // ordering
        return json;
    };

    elementReaders["UML:Attribute"] = function (node) {
        var json = elementReaders["UML:StructuralFeature"](node);
        json["_type"] = "UMLAttribute";
        // readExpression: json["defaultValue"] = readString(node, "initialValue", "");
        // changeability
        // targetScope
        // ordering
        return json;
    };

    elementReaders["UML:BehavioralFeature"] = function (node) {
        var json = elementReaders["UML:Feature"](node);
        json["isQuery"] = readBoolean(node, "isQuery", false);
        json["parameters"] = readCompositions(node, "UML:BehavioralFeature.parameter");
        return json;
    };

    elementReaders["UML:Operation"] = function (node) {
        var json = elementReaders["UML:BehavioralFeature"](node);
        json["_type"] = "UMLOperation";
        // concurrency
        // isRoot
        // isLeaf
        // isAbstract
        // specification
        return json;
    };

    elementReaders["UML:Classifier"] = function (node) {
        var json = elementReaders["UML:Namespace"](node);
        _.extend(json, elementReaders["UML:GeneralizableElement"](node));
        var features = readCompositions(node, "UML:Classifier.feature");
        json["attributes"] = _.filter(features, function (f) {
            return f._type === "UMLAttribute";
        });
        json["operations"] = _.filter(features, function (f) {
            return f._type === "UMLOperation";
        });
        return json;
    };

    elementReaders["UML:Class"] = function (node) {
        var json = elementReaders["UML:Classifier"](node);
        json["_type"] = "UMLClass";
        return json;
    };

    elementReaders["UML:Model"] = function (node) {
        var json = elementReaders["UML:Namespace"](node);
        json["_type"] = "UMLModel";
        return json;
    };


    /**
     * Load from file
     *
     * @param {string} filename
     * @return {$.Promise}
     */
    function loadFromFile(filename) {
        var result = new $.Deferred(),
            dialog = Dialogs.showSimpleDialog("Loading \"" + filename + "\""),
            file = FileSystem.getFileForPath(filename);

        FileUtils.readAsText(file)
            .done(function (data) {
                try {
                    var i, len;
                    // Parse XML
                    var parser = new DOMParser();
                    var dom = parser.parseFromString(data, "text/xml");

                    var XMINode        = dom.getElementsByTagName("XMI")[0],
                        XMIHeaderNode  = dom.getElementsByTagName("XMI.header")[0],
                        XMIContentNode = dom.getElementsByTagName("XMI.content")[0];



                    console.log(XMINode.nodeName);
                    console.log(XMIHeaderNode.nodeName);
                    console.log(XMIContentNode.nodeName);


                    var elements = readCompositions(XMINode, "XMI.content");
                    console.log(JSON.stringify(elements, null, 2));

                    /*
                    // Transform XML to JSON
                    Reader.clear();
                    var bodyDom = xmlDom.getElementsByTagName("BODY")[0];
                    var project = Reader.readObj(bodyDom, "DocumentElement");
                    project._parent = null;
                    // Post Processing
                    Reader.postprocess();
                    // console.log(xmlDom);
                    // console.log(project);
                    */
                } catch (err) {
                    console.error("[Error] Failed to load the file: " + filename);
                    result.reject(err);
                }
            })
            .fail(function (err) {
                result.reject(err);
            })
            .always(function () {
                dialog.close();
            });
        return result.promise();
    }

    exports.loadFromFile = loadFromFile;

});
