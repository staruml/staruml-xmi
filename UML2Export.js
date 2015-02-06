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
/*global $, _, define, app, type */

define(function (require, exports, module) {
    "use strict";

    var IdGenerator      = app.getModule("core/IdGenerator"),
        MetaModelManager = app.getModule("core/MetaModelManager"),
        UML              = app.getModule("uml/UML");

    var Writer = require("XMI21Writer");

    // Core ....................................................................

    Writer.elements["Element"] = function (elem) {
        var json = {};
        Writer.writeString(json, 'xmi:id', elem._id);
        return json;
    };

    Writer.elements["Model"] = function (elem) {
        var json = Writer.elements["Element"](elem);
        Writer.writeString(json, 'name', elem.name);
        if (elem instanceof type.UMLPackage) {
            Writer.writeElementArray(json, 'packagedElement', elem.ownedElements);
        } else {
            Writer.writeElementArray(json, 'ownedMember', elem.ownedElements);
        }
        return json;
    };

    Writer.elements["ExtensibleModel"] = function (elem) {
        var json = Writer.elements["Model"](elem);
        // TODO: documentation
        // TODO: tags
        return json;
    };

    Writer.elements["Relationship"] = function (elem) {
        var json = Writer.elements["ExtensibleModel"](elem);
        return json;
    };

    Writer.elements["DirectedRelationship"] = function (elem) {
        var json = Writer.elements["Relationship"](elem);
        // source
        // target
        return json;
    };

    Writer.elements["RelationshipEnd"] = function (elem) {
        var json = Writer.elements["ExtensibleModel"](elem);
        // reference
        return json;
    };

    Writer.elements["UndirectedRelationship"] = function (elem) {
        var json = Writer.elements["Relationship"](elem);
        // end1
        // end2
        return json;
    };

    // Enumerations ............................................................

    Writer.enumerations["UMLVisibilityKind"] = function (value) {
        switch (value) {
        case UML.VK_PUBLIC    : return "public";
        case UML.VK_PROTECTED : return "protected";
        case UML.VK_PRIVATE   : return "private";
        case UML.VK_PACKAGE   : return "package";
        default               : return "public";
        }
    };

    Writer.enumerations["UMLAggregationKind"] = function (value) {
        switch (value) {
        case UML.AK_NONE      : return "none";
        case UML.AK_SHARED    : return "shared";
        case UML.AK_COMPOSITE : return "composite";
        default               : return "none";
        }
    };

    Writer.enumerations["UMLDirectionKind"] = function (value) {
        switch (value) {
        case UML.DK_IN     : return "in";
        case UML.DK_INOUT  : return "inout";
        case UML.DK_OUT    : return "out";
        case UML.DK_RETURN : return "return";
        default            : return "in";
        }
    };

    Writer.enumerations["UMLCallConcurrencyKind"] = function (value) {
        switch (value) {
        case UML.CCK_SEQUENTIAL : return "sequential";
        case UML.CCK_GUARDED    : return "guarded";
        case UML.CCK_CONCURRENT : return "concurrent";
        default                 : return "sequential";
        }
    };

    // Backbone ................................................................

    Writer.elements["UMLModelElement"] = function (elem) {
        var json = Writer.elements["ExtensibleModel"](elem);
        // TODO: stereotype
        Writer.writeEnum(json, 'visibility', 'UMLVisibilityKind', elem.visibility);
        if (elem.templateParameters.length > 0) {
            json["ownedTemplateSignature"] = {
                "xmi:id": IdGenerator.generateGuid(),
                "xmi:type": (elem instanceof type.UMLClassifier ? "uml:RedefinableTemplateSignature" : "uml:TemplateSignature")
            };
            Writer.writeElementArray(json["ownedTemplateSignature"], 'ownedParameter', elem.templateParameters);
        }
        return json;
    };

    Writer.elements["UMLConstraint"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        // specification
        // containedElements
        Writer.setType(json, 'uml:Constraint');
        return json;
    };

    Writer.elements["UMLTemplateParameter"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        Writer.setType(json, elem._parent instanceof type.UMLClassifier ? 'uml:ClassifierTemplateParameter' : 'uml:TemplateParameter');
        json["ownedParameteredElement"] = {
            "xmi:id": IdGenerator.generateGuid(),
            "xmi:type": 'uml:Class',
            "name": elem.name
        };
        // TODO: defaultValue
        return json;
    };

    Writer.elements["UMLFeature"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        Writer.writeBoolean(json, 'isStatic', elem.isStatic);
        Writer.writeBoolean(json, 'isLeaf', elem.isLeaf);
        return json;
    };

    Writer.elements["UMLStructuralFeature"] = function (elem) {
        var json = Writer.elements["UMLFeature"](elem);
        // TODO: type
        if (elem.multiplicity) {
            if (elem.multiplicity.indexOf("..") > 0) {
                var terms = elem.multiplicity.split("..");
                if (terms.length > 1) {
                    terms[0] = terms[0].trim();
                    terms[1] = terms[1].trim();
                    Writer.writeValueSpec(json, 'lowerValue', 'uml:LiteralInteger', terms[0]);
                    if (terms[1] === "*") {
                        Writer.writeValueSpec(json, 'upperValue', 'uml:LiteralUnlimitedNatural', terms[1]);
                    } else {
                        Writer.writeValueSpec(json, 'upperValue', 'uml:LiteralInteger', terms[1]);
                    }
                }
            } else {
                if (elem.multiplicity.trim() === "*") {
                    Writer.writeValueSpec(json, 'lowerValue', 'uml:LiteralUnlimitedNatural', elem.multiplicity.trim());
                    Writer.writeValueSpec(json, 'upperValue', 'uml:LiteralUnlimitedNatural', elem.multiplicity.trim());
                } else {
                    Writer.writeValueSpec(json, 'lowerValue', 'uml:LiteralInteger', elem.multiplicity.trim());
                    Writer.writeValueSpec(json, 'upperValue', 'uml:LiteralInteger', elem.multiplicity.trim());
                }
            }
        }
        Writer.writeValueSpec(json, 'defaultValue', 'uml:LiteralString', elem.defaultValue);
        Writer.writeBoolean(json, 'isReadOnly', elem.isReadOnly);
        Writer.writeBoolean(json, 'isOrdered', elem.isOrdered);
        Writer.writeBoolean(json, 'isUnique', elem.isUnique);
        return json;
    };

    Writer.elements["UMLAttribute"] = function (elem) {
        var json = Writer.elements["UMLStructuralFeature"](elem);
        Writer.setType(json, 'uml:Property');
        Writer.writeEnum(json, 'aggregation', 'UMLAggregationKind', elem.aggregation);
        Writer.writeBoolean(json, 'isDerived', elem.isDerived);
        Writer.writeBoolean(json, 'isID', elem.isID);
        return json;
    };

    Writer.elements["UMLParameter"] = function (elem) {
        var json = Writer.elements["UMLStructuralFeature"](elem);
        Writer.writeEnum(json, 'direction', 'UMLDirectionKind', elem.direction);
        Writer.setType(json, 'uml:Parameter');
        return json;
    };

    Writer.elements["UMLBehavioralFeature"] = function (elem) {
        var json = Writer.elements["UMLFeature"](elem);
        Writer.writeElementArray(json, 'ownedParameter', elem.parameters);
        Writer.writeEnum(json, 'concurrency', 'UMLCallConcurrencyKind', elem.concurrency);
        // TODO: raisedExceptions
        return json;
    };

    Writer.elements["UMLOperation"] = function (elem) {
        var json = Writer.elements["UMLBehavioralFeature"](elem);
        Writer.writeBoolean(json, 'isQuery', elem.isQuery);
        Writer.writeBoolean(json, 'isAbstract', elem.isAbstract);
        // TODO: specification
        // TODO: preconditions
        // TODO: bodyConditions
        // TODO: postconditions
        Writer.setType(json, 'uml:Operation');
        return json;
    };

    Writer.elements["UMLClassifier"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        Writer.writeElementArray(json, 'ownedAttribute', elem.attributes);
        Writer.writeElementArray(json, 'ownedOperation', elem.operations);
        // TODO: behaviors
        Writer.writeBoolean(json, 'isAbstract', elem.isAbstract);
        Writer.writeBoolean(json, 'isFinalSpecialization', elem.isFinalSpecialization);
        Writer.writeBoolean(json, 'isLeaf', elem.isLeaf);
        return json;
    };

    Writer.elements["UMLDirectedRelationship"] = function (elem) {
        var json = Writer.elements["DirectedRelationship"](elem);
        _.extend(json, Writer.elements["UMLModelElement"]);
        return json;
    };

    Writer.elements["UMLRelationshipEnd"] = function (elem) {
        var json = Writer.elements["RelationshipEnd"](elem);
        _.extend(json, Writer.elements["UMLModelElement"]);
        // TODO: navigable
        // TODO: aggregation
        // TODO: multiplicity
        // TODO: defaultValue
        // TODO: isReadOnly
        // TODO: isOrdered
        // TODO: isUnique
        // TODO: isDerived
        // TODO: isID
        return json;
    };

    Writer.elements["UMLUndirectedRelationship"] = function (elem) {
        var json = Writer.elements["UndirectedRelationship"](elem);
        _.extend(json, Writer.elements["UMLModelElement"]);
        return json;
    };

    // Common Behaviors ........................................................



    // Classes .................................................................

    Writer.elements["UMLPackage"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        Writer.setType(json, 'uml:Package');
        return json;
    };

    Writer.elements["UMLModel"] = function (elem) {
        var json = Writer.elements["UMLPackage"](elem);
        Writer.setType(json, 'uml:Model');
        return json;
    };

    Writer.elements["UMLClass"] = function (elem) {
        var json = Writer.elements["UMLClassifier"](elem);
        Writer.setType(json, 'uml:Class');
        return json;
    };

    Writer.elements["UMLDataType"] = function (elem) {
        var json = Writer.elements["UMLClassifier"](elem);
        Writer.setType(json, 'uml:DataType');
        return json;
    };

    Writer.elements["UMLPrimitiveType"] = function (elem) {
        var json = Writer.elements["UMLDataType"](elem);
        Writer.setType(json, 'uml:PrimitiveType');
        return json;
    };

    Writer.elements["UMLEnumerationLiteral"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        Writer.setType(json, 'uml:EnumerationLiteral');
        return json;
    };

    Writer.elements["UMLEnumeration"] = function (elem) {
        var json = Writer.elements["UMLDataType"](elem);
        Writer.setType(json, 'uml:Enumeration');
        Writer.writeElementArray(json, 'ownedLiteral', elem.literals);
        return json;
    };

    Writer.elements["UMLInterface"] = function (elem) {
        var json = Writer.elements["UMLClassifier"](elem);
        Writer.setType(json, 'uml:Interface');
        return json;
    };

    Writer.elements["UMLSignal"] = function (elem) {
        var json = Writer.elements["UMLClassifier"](elem);
        Writer.setType(json, 'uml:Signal');
        return json;
    };

});
