/*
 * JBoss, Home of Professional Open Source
 * Copyright 2013, Red Hat, Inc. and individual contributors
 * by the @authors tag. See the copyright.txt in the distribution for a
 * full listing of individual contributors.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 */

(function ($, rf) {

    rf.ui = rf.ui || {};

    rf.ui.InplaceSelect = function(id, options) {
        var mergedOptions = $.extend({}, defaultOptions, options);
        $super.constructor.call(this, id, mergedOptions);
        this.getInput().bind("click", $.proxy(this.__clickHandler, this));
        mergedOptions['attachTo'] = id;
        mergedOptions['scrollContainer'] = $(document.getElementById(id + "Items")).parent()[0];
        mergedOptions['focusKeeperEnabled'] = false;
        this.popupList = new rf.ui.PopupList(id + "List", this, mergedOptions);
        this.list = this.popupList.__getList();
        this.clientSelectItems = mergedOptions.clientSelectItems;
        this.selValueInput = $(document.getElementById(id + "selValue"));
        this.initialValue = this.selValueInput.val();
        this.listHandler = $(document.getElementById(id + "List"));
        this.listHandler.bind("mousedown", $.proxy(this.__onListMouseDown, this));
        this.listHandler.bind("mouseup", $.proxy(this.__onListMouseUp, this));
        this.openOnEdit = mergedOptions.openOnEdit;
        this.saveOnSelect = mergedOptions.saveOnSelect;
        this.savedIndex = -1;

        this.inputItem = $(document.getElementById(id + "Input"));
        this.inputItemWidth = this.inputItem.width();
        this.inputWidthDefined = options.inputWidth !== undefined;
    };
    rf.ui.InplaceInput.extend(rf.ui.InplaceSelect);
    var $super = rf.ui.InplaceSelect.$super;

    var defaultOptions = {
        defaultLabel: "",
        saveOnSelect: true,
        openOnEdit: true,
        showControl: false,
        itemCss: "rf-is-opt",
        selectItemCss: "rf-is-sel",
        listCss: "rf-is-lst-cord",
        noneCss: "rf-is-none",
        editCss: "rf-is-fld-cntr",
        changedCss: "rf-is-chng"
    };

    $.extend(rf.ui.InplaceSelect.prototype, (function () {

        return{
            name : "inplaceSelect",
            defaultLabelClass : "rf-is-dflt-lbl",

            getName: function() {
                return this.name;
            },
            getNamespace: function() {
                return this.namespace;
            },
            onshow: function() {
                $super.onshow.call(this);
                if (this.openOnEdit) {
                    this.__showPopup();
                }
            },
            onhide: function() {
                this.__hidePopup();
            },

            showPopup: function() {
                $super.__show.call(this);

            },
            __showPopup: function() {
                this.popupList.show();
                this.__hideLabel();
            },
            hidePopup: function() {
            	$super.__hide.call(this);
            },
            __hidePopup: function() {
                this.popupList.hide();
                this.__showLabel();
            },

            onsave: function() {
                var item = this.list.currentSelectItem();
                if (item) {
                    var index = this.list.getSelectedItemIndex();
                    var clientSelectItem = this.list.getClientSelectItemByIndex(index);
                    var label = clientSelectItem.label;
                    if (label == this.__getValue()) {
                        this.savedIndex = index;
                        this.saveItemValue(clientSelectItem.value);
                        this.list.__selectByIndex(this.savedIndex);
                    } else {
                        this.list.__selectItemByValue(this.getValue());
                    }
                }
            },
            oncancel: function() {
                var item = this.list.getClientSelectItemByIndex(this.savedIndex);
                var value = item && item.value ? item.value : this.initialValue;
                this.saveItemValue(value);
                this.list.__selectItemByValue(value);
            },
            onblur: function(e) {
                this.__hidePopup();
                $super.onblur.call(this);
            },
            onfocus: function(e) {
                if (!this.__isFocused()) {
                    this.__setFocused(true);
                    this.focusValue = this.selValueInput.val();
                    this.invokeEvent.call(this, "focus", document.getElementById(this.id), e);
                }
            },
            processItem: function(item) {
                var label = $(item).data('clientSelectItem').label;
                this.__setValue(label);

                this.__setInputFocus();
                this.__hidePopup();

                if (this.saveOnSelect) {
                    this.save();
                }

                this.invokeEvent.call(this, "selectitem", document.getElementById(this.id));
            },
            saveItemValue: function(value) {
                this.selValueInput.val(value);

            },
            __isValueChanged: function() {
                return (this.focusValue != this.selValueInput.val());
            },
            __keydownHandler: function(e) {

                var code;

                if (e.keyCode) {
                    code = e.keyCode;
                } else if (e.which) {
                    code = e.which;
                }

                if (this.popupList.isVisible()) {
                    switch (code) {
                        case rf.KEYS.DOWN:
                            e.preventDefault();
                            this.list.__selectNext();
                            this.__setInputFocus();
                            break;

                        case rf.KEYS.UP:
                            e.preventDefault();
                            this.list.__selectPrev();
                            this.__setInputFocus();
                            break;

                        case rf.KEYS.RETURN:
                            e.preventDefault();
                            this.list.__selectCurrent();
                            this.__setInputFocus();
                            return false;
                            break;
                    }
                }

                $super.__keydownHandler.call(this, e);
            },
            __blurHandler: function(e) {
                if (this.saveOnSelect || !this.isMouseDown) {
                    if (this.isEditState()) {
                        this.timeoutId = window.setTimeout($.proxy(function() {
                            this.onblur(e);
                        }, this), 200);
                    }
                } else {
                    this.__setInputFocus();
                    this.isMouseDown = false;
                }
            },
            __clickHandler: function(e) {
                this.__showPopup();
            },
            __onListMouseDown: function(e) {
                this.isMouseDown = true;
            },
            __onListMouseUp: function(e) {
                this.isMouseDown = false;
                this.__setInputFocus();
            },
            __showLabel: function(e) {
                this.label.show();
                this.editContainer.css("position", "absolute");
                this.inputItem.width(this.inputItemWidth);
            },
            __hideLabel: function(e) {
                this.label.hide();
                this.editContainer.css("position", "static");
                if (!this.inputWidthDefined) {
                    this.inputItem.width(this.label.width());
                }
            },
            getValue: function() {
                return this.selValueInput.val();
            },
            setValue: function(value) {
                var item = this.list.__selectItemByValue(value);
                var clientSelectItem = item.data('clientSelectItem');
                this.__setValue(clientSelectItem.label);
                if (this.__isValueChanged()) {
                    this.save();
                    this.invokeEvent.call(this, "change", document.getElementById(this.id));
                }
            },
            destroy: function() {
                this.popupList.destroy();
                this.popupList = null;
                $super.destroy.call(this);
            }
        };

    })());
})(RichFaces.jQuery, RichFaces);
