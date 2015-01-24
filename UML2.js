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

    var IdGenerator = app.getModule("core/IdGenerator"),
        UML         = app.getModule("uml/UML");

    var Reader = require("XMI21Reader");

    function appendTo(json, field, elements) {
        if (!Array.isArray(json[field])) {
            json[field] = [];
        }
        var arr = json[field];
        _.each(elements, function (elem) {
            if (!_.contains(arr, elem)) {
                arr.push(elem);
            }
        });
    }

    // Enumerations ............................................................

    Reader.enumerations["uml:AggregationKind"] = {
        "none"      : UML.AK_NONE,
        "shared"    : UML.AK_SHARED,
        "composite" : UML.AK_COMPOSITE
    };

    Reader.enumerations["uml:VisibilityKind"] = {
        "public"    : UML.VK_PUBLIC,
        "protected" : UML.VK_PROTECTED,
        "private"   : UML.VK_PRIVATE,
        "package"   : UML.VK_PACKAGE
    };

    Reader.enumerations["uml:ParameterDirectionKind"] = {
        "in"     : UML.DK_IN,
        "inout"  : UML.DK_INOUT,
        "out"    : UML.DK_OUT,
        "return" : UML.DK_RETURN
    };

    // Kernel ..................................................................

    Reader.elements["uml:Element"] = function (node) {
        var json = { tags: [] };
        json["_id"] = Reader.readString(node, "xmi:id", IdGenerator.generateGuid());
        return json;
    };

    // Expressions .............................................................

    Reader.elements["uml:ValueSpecification"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        return json;
    };

    Reader.elements["uml:LiteralSpecification"] = function (node) {
        var json = Reader.elements["uml:ValueSpecification"](node);
        return json;
    };

    Reader.elements["uml:LiteralBoolean"] = function (node) {
        var json = Reader.elements["uml:LiteralSpecification"](node);
        var val = Reader.readBoolean(node, "value", false);
        return val;
    };

    Reader.elements["uml:LiteralInteger"] = function (node) {
        var json = Reader.elements["uml:LiteralSpecification"](node);
        var val = Reader.readInteger(node, "value", 0);
        return val;
    };

    Reader.elements["uml:LiteralString"] = function (node) {
        var json = Reader.elements["uml:LiteralSpecification"](node);
        var val = Reader.readString(node, "value", "");
        return val;
    };

    Reader.elements["uml:LiteralUnlimitedNatural"] = function (node) {
        var json = Reader.elements["uml:LiteralSpecification"](node);
        var val = Reader.readString(node, "value", "");
        if (val === "-1") { // for EA
            val = "*";
        }
        return val;
    };

    Reader.elements["uml:LiteralNull"] = function (node) {
        var json = Reader.elements["uml:LiteralSpecification"](node);
        return null;
    };

    // Core ....................................................................

    Reader.elements["uml:MultiplicityElement"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        json["isOrdered"] = Reader.readBoolean(node, "isOrdered", false);
        json["isUnique"] = Reader.readBoolean(node, "isUnique", false);
        var lowerValue = Reader.readElement(node, "lowerValue");
        var upperValue = Reader.readElement(node, "upperValue");
        json["multiplicity"] = (lowerValue && upperValue ? lowerValue + ".." + upperValue : lowerValue || upperValue || "");
        if (json["multiplicity"] === "1..1") { // for EA
            json["multiplicity"] = "";
        }
        return json;
    };

    Reader.elements["uml:NamedElement"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        json["name"] = Reader.readString(node, "name", "");
        json["visibility"] = Reader.readEnum(node, "visibility", "uml:VisibilityKind", UML.VK_PUBLIC);
        return json;
    };

    Reader.elements["uml:PackageableElement"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        return json;
    };

    Reader.elements["uml:Namespace"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        appendTo(json, "ownedElements", Reader.readElementArray(node, "ownedMember"));
        return json;
    };

    Reader.elements["uml:Package"] = function (node) {
        var json = Reader.elements["uml:Namespace"](node);
        _.extend(json, Reader.elements["uml:PackageableElement"](node));
        json["_type"] = "UMLPackage";
        appendTo(json, "ownedElements", Reader.readElementArray(node, "packagedElement"));
        // TODO: ownedType
        // TODO: nestedPackage
        return json;
    };

    Reader.elements["uml:Model"] = function (node) {
        var json = Reader.elements["uml:Package"](node);
        json["_type"] = "UMLModel";
        return json;
    };

    Reader.elements["uml:TypedElement"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        json["type"] = Reader.readRef(node, "type");
        return json;
    };

    Reader.elements["uml:RedefinableElement"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        json["isLeaf"] = Reader.readBoolean(node, "isLeaf", false);
        return json;
    };

    Reader.elements["uml:Feature"] = function (node) {
        var json = Reader.elements["uml:RedefinableElement"](node);
        json["isStatic"] = Reader.readBoolean(node, "isStatic", false);
        return json;
    };

    Reader.elements["uml:StructuralFeature"] = function (node) {
        var json = Reader.elements["uml:Feature"](node);
        _.extend(json, Reader.elements["uml:TypedElement"](node));
        _.extend(json, Reader.elements["uml:MultiplicityElement"](node));
        json["isReadOnly"] = Reader.readBoolean(node, "isReadOnly", false);
        return json;
    };

    Reader.elements["uml:Property"] = function (node) {
        var json = Reader.elements["uml:StructuralFeature"](node);
        json["_type"] = "UMLAttribute";
        json["isDerived"] = Reader.readBoolean(node, "isDerived", false);
        // isDerivedUnion
        json["aggregation"] = Reader.readEnum(node, "aggregation", "uml:AggregationKind", UML.AK_NONE);
        json["defaultValue"] = Reader.readElement(node, "defaultValue") || "";
        return json;
    };

    Reader.elements["uml:Parameter"] = function (node) {
        var json = Reader.elements["uml:TypedElement"](node);
        _.extend(json, Reader.elements["uml:MultiplicityElement"](node));
        json["_type"] = "UMLParameter";
        json["defaultValue"] = Reader.readElement(node, "defaultValue") || "";
        json["direction"] =
            Reader.readEnum(node, "direction", "uml:ParameterDirectionKind") ||
            Reader.readEnum(node, "kind", "uml:ParameterDirectionKind") ||
            UML.DK_IN;
        return json;
    };

    Reader.elements["uml:BehavioralFeature"] = function (node) {
        var json = Reader.elements["uml:Feature"](node);
        _.extend(json, Reader.elements["uml:Namespace"](node));
        json["parameters"] = Reader.readElementArray(node, "ownedParameter", "uml:Parameter");
        return json;
    };

    Reader.elements["uml:Operation"] = function (node) {
        var json = Reader.elements["uml:BehavioralFeature"](node);
        json["_type"] = "UMLOperation";
        json["isQuery"] = Reader.readBoolean(node, "isQuery", false);
        json["isAbstract"] = Reader.readBoolean(node, "isAbstract", false);
        return json;
    };

    Reader.elements["uml:Type"] = function (node) {
        var json = Reader.elements["uml:PackageableElement"](node);
        return json;
    };

    Reader.elements["uml:Classifier"] = function (node) {
        var json = Reader.elements["uml:Namespace"](node);
        _.extend(json, Reader.elements["uml:RedefinableElement"](node));
        _.extend(json, Reader.elements["uml:Type"](node));
        json["isAbstract"] = Reader.readBoolean(node, "isAbstract", false);
        json["attributes"] = Reader.readElementArray(node, "ownedAttribute", "uml:Property");
        json["operations"] = Reader.readElementArray(node, "ownedOperation", "uml:Operation");
        return json;
    };

    Reader.elements["uml:Class"] = function (node) {
        var json = Reader.elements["uml:Classifier"](node);
        json["_type"] = "UMLClass";
        return json;
    };

    Reader.elements["uml:DataType"] = function (node) {
        var json = Reader.elements["uml:Classifier"](node);
        json["_type"] = "UMLDataType";
        return json;
    };


});
