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

    var IdGenerator      = app.getModule("core/IdGenerator"),
        MetaModelManager = app.getModule("core/MetaModelManager"),
        UML              = app.getModule("uml/UML");

    var Reader = require("XMI21Reader");

    function addTo(json, field, element) {
        if (!Array.isArray(json[field])) {
            json[field] = [];
        }
        var arr = json[field];
        if (element) {
            arr.push(element);
        }
    }

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

    Reader.elements["uml:Relationship"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        return json;
    };

    Reader.elements["uml:DirectedRelationship"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
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
        if (lowerValue !== null && upperValue !== null) {
            json["multiplicity"] = lowerValue + ".." + upperValue;
        } else if (lowerValue !== null) {
            json["multiplicity"] = lowerValue;
        } else if (upperValue !== null) {
            json["multiplicity"] = upperValue;
        }
        if (json["multiplicity"] === "*..*") { // for EA
            json["multiplicity"] = "*";
        }
        if (json["multiplicity"] === "1..1" || json["multiplicity"] === "0..0") { // for EA
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
        // TODO: read type for EA
        return json;
    };

    Reader.elements["uml:RedefinableElement"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        json["isLeaf"] = Reader.readBoolean(node, "isLeaf", false);
        return json;
    };

    // Features ................................................................

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
        // Read as an AssociationEnd
        json["navigable"] = Reader.readBoolean(node, "isNavigable", false);
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

    // Templates ...............................................................

    Reader.elements["uml:TemplateableElement"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        var ts = Reader.readElement(node, "ownedTemplateSignature");
        json["templateParameters"] = ts ? ts["__ownedParameter"] : [];
        return json;
    };

    Reader.elements["uml:ParameterableElement"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        return json;
    };

    Reader.elements["uml:TemplateSignature"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        json["__ownedParameter"] = Reader.readElementArray(node, "ownedParameter");
        return json;
    };

    Reader.elements["uml:RedefinableTemplateSignature"] = function (node) {
        var json = Reader.elements["uml:TemplateSignature"](node);
        _.extend(json, Reader.elements["uml:RedefinableElement"](node));
        return json;
    };

    Reader.elements["uml:TemplateParameter"] = function (node) {
        var json = Reader.elements["uml:Element"](node);
        json["_type"] = "UMLTemplateParameter";
        var pe = Reader.readElement(node, "ownedParameteredElement");
        json["name"] =
            (pe ? pe.name : null) ||
            Reader.readString(node, "name") ||
            "";
        json["defaultValue"] =
            Reader.readElement(node, "defaultValue") || // for VP
            "";
        // TODO: defaultValue for EA
        // TODO: parameterType
        return json;
    };

    Reader.elements["uml:ClassifierTemplateParameter"] = function (node) {
        var json = Reader.elements["uml:TemplateParameter"](node);
        return json;
    };


    // Instances ...............................................................

    Reader.elements["uml:InstanceSpecification"] = function (node) {
        var json = Reader.elements["uml:NamedElement"](node);
        json["specification"] = Reader.readElement(node, "specification");
        // TODO: slots
        // TODO: classifier
        return json;
    };


    // Types ...................................................................


    Reader.elements["uml:Type"] = function (node) {
        var json = Reader.elements["uml:PackageableElement"](node);
        return json;
    };

    Reader.elements["uml:Classifier"] = function (node) {
        var json = Reader.elements["uml:Namespace"](node);
        _.extend(json, Reader.elements["uml:RedefinableElement"](node));
        _.extend(json, Reader.elements["uml:Type"](node));
        _.extend(json, Reader.elements["uml:TemplateableElement"](node));
        _.extend(json, Reader.elements["uml:ParameterableElement"](node));
        json["isAbstract"] = Reader.readBoolean(node, "isAbstract", false);
        json["attributes"] = Reader.readElementArray(node, "ownedAttribute", "uml:Property");
        json["operations"] = Reader.readElementArray(node, "ownedOperation", "uml:Operation");
        var _generalizations = Reader.readElementArray(node, "generalization");
        _.each(_generalizations, function (g) {
            g["source"] = { "$ref": json._id };
            addTo(json, "ownedElements", g);
        });
        return json;
    };

    Reader.elements["uml:Class"] = function (node) {
        var json = Reader.elements["uml:Classifier"](node);
        json["_type"] = "UMLClass";
        return json;
    };

    Reader.elements["uml:Interface"] = function (node) {
        var json = Reader.elements["uml:Classifier"](node);
        json["_type"] = "UMLInterface";
        return json;
    };

    Reader.elements["uml:DataType"] = function (node) {
        var json = Reader.elements["uml:Classifier"](node);
        json["_type"] = "UMLDataType";
        return json;
    };

    Reader.elements["uml:PrimitiveType"] = function (node) {
        var json = Reader.elements["uml:DataType"](node);
        json["_type"] = "UMLPrimitiveType";
        return json;
    };

    Reader.elements["uml:EnumerationLiteral"] = function (node) {
        var json = Reader.elements["uml:InstanceSpecification"](node);
        json["_type"] = "UMLEnumerationLiteral";
        return json;
    };

    Reader.elements["uml:Enumeration"] = function (node) {
        var json = Reader.elements["uml:DataType"](node);
        json["_type"] = "UMLEnumeration";
        json["literals"] = Reader.readElementArray(node, "ownedLiteral");
        return json;
    };

    Reader.elements["uml:Generalization"] = function (node) {
        var json = Reader.elements["uml:DirectedRelationship"](node);
        json["_type"] = "UMLGeneralization";
        json["target"] = Reader.readRef(node, "general");
        return json;
    };

    Reader.elements["uml:Dependency"] = function (node) {
        var json = Reader.elements["uml:DirectedRelationship"](node);
        _.extend(json, Reader.elements["uml:PackageableElement"](node));
        json["_type"] = "UMLDependency";
        json["source"] = Reader.readRef(node, "client");
        json["target"] = Reader.readRef(node, "supplier");
        return json;
    };

    Reader.elements["uml:Abstraction"] = function (node) {
        var json = Reader.elements["uml:Dependency"](node);
        json["_type"] = "UMLAbstraction";
        return json;
    };

    Reader.elements["uml:Usage"] = function (node) {
        var json = Reader.elements["uml:Dependency"](node);
        json["_type"] = "UMLDependency";
        json["stereotype"] = "use";
        return json;
    };

    Reader.elements["uml:Realization"] = function (node) {
        var json = Reader.elements["uml:Abstraction"](node);
        json["_type"] = "UMLRealization";
        return json;
    };

    Reader.elements["uml:InterfaceRealization"] = function (node) {
        var json = Reader.elements["uml:Realization"](node);
        json["_type"] = "UMLInterfaceRealization";
        return json;
    };

    Reader.elements["uml:Association"] = function (node) {
        var json = Reader.elements["uml:Relationship"](node);
        _.extend(json, Reader.elements["uml:Classifier"](node));
        json["_type"] = "UMLAssociation";
        var _ends = Reader.readElementArray(node, "ownedEnd");
        if (_ends && _ends.length > 1) {
            _ends[0]._type = "UMLAssociationEnd";
            _ends[1]._type = "UMLAssociationEnd";
            _ends[0].reference = _ends[0].type;
            _ends[1].reference = _ends[1].type;
            var _agg = _ends[0].aggregation;
            _ends[0].aggregation = _ends[1].aggregation;
            _ends[1].aggregation = _agg;
            json["end1"] = _ends[0];
            json["end2"] = _ends[1];
        }
        return json;
    };

    // Post-processors .........................................................

    // process ComponentRealization
    Reader.postprocessors.push(function (elem) {
        if (elem._type === "UMLRealization") {
            var source = Reader.get(elem.source.$ref),
                target = Reader.get(elem.target.$ref);
            if (MetaModelManager.isKindOf(target._type, "UMLComponent")) {
                elem._type = "UMLComponentRealization";
            }
            if (MetaModelManager.isKindOf(target._type, "UMLInterface")) {
                elem._type = "UMLInterfaceRealization";
            }
        }
    });


});
