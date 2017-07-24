var type;

function BarMenu(pkx, module, configuration) {
    var self = this;

    function mouseOverChild(sender, e) {
        var activeChild = null;
        var children = self.getChildren();
        for (var c in children) {
            if (children[c].state.on) {
                activeChild = children[c];
                break;
            }
        }
        if (activeChild != null) {
            if (sender != activeChild) {
                activeChild.switch(false);
                //menu bar item is already activated
                //sender.switch(true);
            }
            else {
                //this is needed because the menu bar items are set to on when the mouse hovers over the item, due to
                //the order of the events, the state change has already happened.
                for (var c in children) {
                    if (children[c] != sender && children[c].state.on) {
                        children[c].switch(false);
                    }
                }
            }
        }
    }

    this.addItem = function(control) {
        if (control.events != null && type.isFunction(control.events.addEventListener)) {
            control.events.addEventListener("mouseover", mouseOverChild);
        }
        this.addChild(control, this.dom.node);
    }
}
BarMenu.prototype = {
    "name" : "BarMenu",
    "version" : "1.0",
    "spec" : "SKCS-02-R0",
    "containers" : [
        {
            "name" : "items",
            "funct" : "addItem"
        }
    ],
    "attributes" : [
        {
            "name" : "align",
            "property" : "align",
            "type" : "string"
        }
    ],
    "events" : [
    ],
    "addDefaults" : false,
    "settings" : {
        "behavior" : {
            "dummy" : false,
            "autoUpdateChildren" : true
        }
    },
    "addItem": function(control) {
        return this.addItem(control);
    },
    "show" : function() {
        //show children
        var children = this.getChildren();
        for (var c in children) {
            children[c].show(this);
        }
    },
    "hide" : function() {
        //hide children
        var children = this.getChildren();
        for (var c in children) {
            children[c].hide();
        }
    }
};  

define(function(fact, pkx, module, configuration) {
    type = type || require("cc.type");

    return {
        "definition" : BarMenu.prototype,
        "type" : BarMenu
    }
});