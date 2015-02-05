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
    }

    Writer.elements["Model"] = function (elem) {
        var json = Writer.elements["Element"](elem);
        Writer.writeString(json, 'name', elem.name);
        if (elem instanceof type.UMLPackage) {
            Writer.writeElementArray(json, 'packagedElement', elem.ownedElements);
        } else {
            Writer.writeElementArray(json, 'ownedMember', elem.ownedElements);
        }
        return json;
    }

    Writer.elements["ExtensibleModel"] = function (elem) {
        var json = Writer.elements["Model"](elem);
        // TODO: documentation
        // TODO: tags
        return json;
    }

    Writer.elements["Relationship"] = function (elem) {
        var json = Writer.elements["ExtensibleModel"](elem);
        return json;
    }

    Writer.elements["DirectedRelationship"] = function (elem) {
        var json = Writer.elements["Relationship"](elem);
        // source
        // target
        return json;
    }

    Writer.elements["RelationshipEnd"] = function (elem) {
        var json = Writer.elements["ExtensibleModel"](elem);
        // reference
        return json;
    }

    Writer.elements["UndirectedRelationship"] = function (elem) {
        var json = Writer.elements["Relationship"](elem);
        // end1
        // end2
        return json;
    }

    // Enumerations ............................................................

    Writer.enumerations["UMLVisibilityKind"] = function (value) {
        switch (value) {
        case UML.VK_PUBLIC    : return "public";
        case UML.VK_PROTECTED : return "protected";
        case UML.VK_PRIVATE   : return "private";
        case UML.VK_PACKAGE   : return "package";
        }
    };

    // Backbone ................................................................

    Writer.elements["UMLModelElement"] = function (elem) {
        var json = Writer.elements["ExtensibleModel"](elem);
        // TODO: stereotype
        Writer.writeEnum(json, 'visibility', 'UMLVisibilityKind', elem.visibility);
        Writer.writeElementArray(json, 'ownedAttribute', elem.templateParameters);
        if (elem.templateParameters.length > 0) {
            json["ownedTemplateSignature"] = {
                "xmi:id": IdGenerator.generateGuid(),
                "xmi:type": "uml:TemplateSignature"
            };
            Writer.writeElementArray(json["ownedTemplateSignature"], 'ownedParameter', elem.templateParameters);
        }
        return json;
    }

    Writer.elements["UMLConstraint"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        // specification
        // containedElements
        Writer.setType(json, 'uml:Constraint');
        return json;
    }

    Writer.elements["UMLTemplateParameter"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        // parameterType
        // defaultValue
        Writer.setType(json, 'uml:TemplateParameter');
        return json;
    }

    Writer.elements["UMLFeature"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        // isStatic
        // isLeaf
        return json;
    }

    Writer.elements["UMLStructuralFeature"] = function (elem) {
        var json = Writer.elements["UMLFeature"](elem);
        // type
        // multiplicity
        // isReadOnly
        // isOrdered
        // isUnique
        // defaultValue
        return json;
    }

    Writer.elements["UMLAttribute"] = function (elem) {
        var json = Writer.elements["UMLStructuralFeature"](elem);
        Writer.setType(json, 'uml:Attribute');
        return json;
    }

    Writer.elements["UMLParameter"] = function (elem) {
        var json = Writer.elements["UMLStructuralFeature"](elem);
        // direction
        Writer.setType(json, 'uml:Parameter');
        return json;
    }

    Writer.elements["UMLBehavioralFeature"] = function (elem) {
        var json = Writer.elements["UMLFeature"](elem);
        // parameters
        // raisedExceptions
        // concurrency
        return json;
    }

    Writer.elements["UMLOperation"] = function (elem) {
        var json = Writer.elements["UMLBehavioralFeature"](elem);
        // isQuery
        // isAbstract
        // specification
        // preconditions
        // bodyConditions
        // postconditions
        Writer.setType(json, 'uml:Operation');
        return json;
    }

    Writer.elements["UMLClassifier"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        Writer.writeElementArray(json, 'ownedAttribute', elem.attributes);
        Writer.writeElementArray(json, 'ownedOperation', elem.operations);
        // behaviors
        // isAbstract
        // isFinalSpecialization
        // isLeaf
        return json;
    }

    Writer.elements["UMLDirectedRelationship"] = function (elem) {
        var json = Writer.elements["DirectedRelationship"](elem);
        _.extend(json, Writer.elements["UMLModelElement"]);
        return json;
    }

    Writer.elements["UMLRelationshipEnd"] = function (elem) {
        var json = Writer.elements["RelationshipEnd"](elem);
        _.extend(json, Writer.elements["UMLModelElement"]);
        // navigable
        // aggregation
        // multiplicity
        // defaultValue
        // isReadOnly
        // isOrdered
        // isUnique
        // isDerived
        // isID
        return json;
    }

    Writer.elements["UMLUndirectedRelationship"] = function (elem) {
        var json = Writer.elements["UndirectedRelationship"](elem);
        _.extend(json, Writer.elements["UMLModelElement"]);
        return json;
    }

    // Common Behaviors ........................................................



    // Classes .................................................................

    Writer.elements["UMLPackage"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        Writer.setType(json, 'uml:Package');
        return json;
    }

    Writer.elements["UMLModel"] = function (elem) {
        var json = Writer.elements["UMLPackage"](elem);
        Writer.setType(json, 'uml:Model');
        return json;
    }

    Writer.elements["UMLClass"] = function (elem) {
        var json = Writer.elements["UMLClassifier"](elem);
        Writer.setType(json, 'uml:Class');
        return json;
    }

});
