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

    var Commands       = app.getModule("command/Commands"),
        CommandManager = app.getModule("command/CommandManager"),
        ProjectManager = app.getModule("engine/ProjectManager"),
        MenuManager    = app.getModule("menu/MenuManager"),
        FileUtils      = app.getModule("file/FileUtils"),
        FileSystem     = app.getModule("filesystem/FileSystem");

    var XMI21Reader    = require("XMI21Reader"),
        XMI21Writer    = require("XMI21Writer"),
        UML2Import     = require("UML2Import"),
        UML2Export     = require("UML2Export");

    var CMD_XMI_IMPORT_V21 = 'xmi.import.v2.1',
        CMD_XMI_EXPORT_V21 = 'xmi.export.v2.1';

    var USER_CANCELED = { userCanceled: true };

    function _handleXMI21Import(fullPath) {
        var result = new $.Deferred();
        if (fullPath) {
            XMI21Reader.loadFromFile(fullPath).then(result.resolve, result.reject);
        } else {
            FileSystem.showOpenDialog(false, false, "Select a XMI File (.xmi)", null, ["xmi"], function (err, files) {
                if (!err) {
                    if (files && files.length > 0) {
                        XMI21Reader.loadFromFile(files[0]).then(result.resolve, result.reject);
                    } else {
                        result.reject(USER_CANCELED);
                    }
                } else {
                    result.reject(err);
                }
            });
        }
        return result.promise();
    }

    function _handleXMI21Export(fullPath) {
        var result = new $.Deferred();
        if (fullPath) {
            XMI21Writer.saveToFile(fullPath).then(result.resolve, result.reject);
        } else {
            var _filename = FileUtils.convertToWindowsFilename(ProjectManager.getProject().name);
            FileSystem.showSaveDialog("Export Project As XMI", null, _filename + ".xmi", function (err, selectedPath) {
                if (!err) {
                    XMI21Writer.saveToFile(selectedPath).then(result.resolve, result.reject);
                } else {
                    result.reject(err);
                }
            });
        }
        return result.promise();
    }

    // Register Commands
    CommandManager.register("XMI Import (v2.1)...",  CMD_XMI_IMPORT_V21, _handleXMI21Import);
    CommandManager.register("XMI Export (v2.1)...",  CMD_XMI_EXPORT_V21, _handleXMI21Export);

    // Setup Menus
    var menuItem = MenuManager.getMenuItem(Commands.FILE_IMPORT);
    menuItem.addMenuDivider();
    menuItem.addMenuItem(CMD_XMI_IMPORT_V21);
    menuItem = MenuManager.getMenuItem(Commands.FILE_EXPORT);
    menuItem.addMenuDivider();
    menuItem.addMenuItem(CMD_XMI_EXPORT_V21);

});
