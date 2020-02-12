/************************************************************************
 * This file is part of EspoCRM.
 *
 * EspoCRM - Open Source CRM application.
 * Copyright (C) 2014-2020 Yuri Kuznetsov, Taras Machyshyn, Oleksiy Avramenko
 * Website: https://www.espocrm.com
 *
 * EspoCRM is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * EspoCRM is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EspoCRM. If not, see http://www.gnu.org/licenses/.
 *
 * The interactive user interfaces in modified source and object code versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU General Public License version 3,
 * these Appropriate Legal Notices must retain the display of the "EspoCRM" word.
 * 
 * Confirm Varchar - Open source field plug in module for EspoCRM
 * Copyright (C) 2020 Omar A Gonsenheim
************************************************************************/

Espo.define('confirm-varchar:views/fields/confirm-varchar', 'views/fields/varchar', function (Dep) {

    return Dep.extend({
        
        afterRender: function () {
            //get the input cell container
            var $cellContainer = this.getCellElement();
            // remove if applicable the input error class
            $cellContainer.removeClass('has-error');
            // define the input field container (inside the cell)
            var $fieldContainer = $('.field[data-name="'+this.name+'"]');
            // define the original input element
            var $originalInput = $('input[data-name="'+this.name+'"]');
            // define the confirm input element
            var $confirmInput = $('input[data-name="'+this.name+'Confirm"]');
            // Append the confirm input to the field container if it doesn't exist already
            if($confirmInput.length === 0) {
                $fieldContainer.append('<input class="main-element form-control hidden" type="text" data-name="'+this.name+'Confirm" value="" placeholder="Confirm input"/>');   
                $confirmInput = $('input[data-name="'+this.name+'Confirm"]');
            }
            // make the confirm input element visible while editing, hide otherwise            
            if(this.mode === 'edit') {
                $confirmInput.removeClass('hidden');
                // load the value stored in the original input into the confirm input to speed up manual input
                $confirmInput.val($originalInput.val());
                var self = this;               
                // if not inline editing, replace temporarily the record "save" button to incorporate the confirm functionality
                if(!this._isInlineEditMode) {        
                    // replace the "save" button in full form editing mode
                    if($('button[data-action="save"]').length !== 0) {
                        var $oldSave = $('button[data-action="save"]');
                        var $newSave = $oldSave.clone().attr('data-action','');
                        $oldSave.replaceWith($newSave);
                        $newSave.click(function(){
                            if(self.verifyInput($originalInput,$confirmInput,$cellContainer)){
                                $newSave.replaceWith($oldSave);
                                $oldSave[0].click();
                            }                                                
                        });                        
                    }
                    // replace the "save" button in modal editing mode                    
                    if($('button[data-name="save"]').length !== 0) {
                        var $oldSave = $('button[data-name="save"]');
                        var $saveParent = $oldSave.parent();
                        //var $newSave = $oldSave.clone().attr('data-name','confirm');
                        var $newSave = $oldSave.clone();
                        // add the new save button
                        $saveParent.prepend($newSave);
                        // hide the standard save button
                        $oldSave.addClass('hidden');
                        $newSave.click(function(){
                            if(self.verifyInput($originalInput,$confirmInput,$cellContainer)){
                                //alert("Inputs match");       
                                // continue with the original save routine
                                $oldSave[0].click();
                            }                                              
                        });                        
                    }    
                    
                }                
            } else {
                $confirmInput.addClass('hidden');
            }
            // call the parent afterRender function
            Dep.prototype.afterRender.call(this);
        },
        
        // verify that the original input and confirm input have the same contents
        verifyInput: function($originalInput,$confirmInput,$cellContainer) {
            if($originalInput.val().trim() !== $confirmInput.val().trim()){
                $cellContainer.addClass('has-error');
                var message = this.translate('inputsMatch', 'labels');
                alert(message);  
                return false;
            } else {
                // NOTE: returns true even if both inputs are blank 
                // to cover cases when the field is not required
                //var inputValue = $originalInput.val().trim().length;
                //var confirmInputValue = $confirmInput.val().trim().length;
                return true;
            }
        },
        
        // custom function to save after inline editing
        inlineEditSave: function () {
            //get the input div container
            var $cellContainer = this.getCellElement();
            // get the original input element
            var $originalInput = $('input[data-name="'+this.name+'"]');
            // get the confirm input element
            var $confirmInput = $('input[data-name="'+this.name+'Confirm"]');
            // If the inputs don't match cancel the edit operation
            if(!this.verifyInput($originalInput,$confirmInput,$cellContainer)) {
                this.inlineEditClose();
                return;
            }    
            var data = this.fetch();
            var self = this;
            var model = this.model;
            var prev = this.initialAttributes;
            model.set(data, {silent: true});
            data = model.attributes;
            var attrs = false;
            for (var attr in data) {
                if (_.isEqual(prev[attr], data[attr])) {
                    continue;
                }
                (attrs || (attrs = {}))[attr] =    data[attr];
            }
            if (!attrs) {
                this.inlineEditClose();
                return;
            }
            if (this.validate()) {
                this.notify('Not valid', 'error');
                model.set(prev, {silent: true});
                return;
            }
            this.notify('Saving...');
            model.save(attrs, {
                success: function () {
                    self.trigger('after:save');
                    model.trigger('after:save');
                    self.notify('Saved', 'success');
                },
                error: function () {
                    self.notify('Error occured', 'error');
                    model.set(prev, {silent: true});
                    self.render();
                },
                patch: true
            });
            this.inlineEditClose(true);
        }
    });
    
});
