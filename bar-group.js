var type;

function BarGroup(pkx, module, configuration) {
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
        if (activeChild != null && sender != activeChild) {
            activeChild.switch();
            sender.switch();
        }
    };

    this.addItem = function(control) {
        if (control.events != null && type.isFunction(control.events.addEventListener)) {
            control.events.addEventListener("mouseover", mouseOverChild);
        }
        self.addChild(control, self.dom.node);
    }
}
BarGroup.prototype = {
    "name" : "BarGroup",
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
            "type" : "string",
            "dataAttribute" : true
        }
    ],
    "events" : [
        {
            "name" : "show",
            "type" : "show"
        }
    ],
    "addDefaults" : false,
    "parentType" : "Bar",
    "settings" : {
        "behavior" : {
            "dummy" : false,
            "autoUpdateChildren" : true
        }
    },
    "addItem": function(control) {
        return this.addItem(control);
    },
    "style" : function () {
        try {
            //set CSS styles for control
            switch (this.align) {
                case null:
                case "":
                case "left":
                    this.dom.node.style.float = "left";
                    break;
                case "right":
                    this.dom.node.style.float = "right";
                    break;
                default:
                    //throw "invalid position '" + this.position + "'.";
                    break;
            }
        }
        catch(e) {
            console.error(e);
        }
    }
};

define(function(fact, pkx, module, configuration) {
    type = type || require("cc.type");

    return {
        "definition" : BarGroup.prototype,
        "type" : BarGroup
    }
});