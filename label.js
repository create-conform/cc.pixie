function Label(pkx, module, configuration) {
}
Label.prototype = {
    "name" : "Label",
    "version" : "1.0",
    "spec" : "SKCS-02-R0",
    "attributes" : [
        {
            "name" : "text",
            "property" : "text",
            "type" : "string"
        },
        {
            "name" : "style",
            "property" : "style",
            "type" : "string"
        },
        {
            "name" : "align",
            "property" : "align",
            "type" : "string",
            "dataAttribute" : true
        },
        {
            "name" : "wrap",
            "property" : "wrap",
            "type" : "boolean",
            "default": false
        },
        {
            "name" : "icon",
            "property" : "icon",
            "type" : "string"
        },
        {
            "name" : "pattern",
            "property" : "pattern",
            "type" : "string",
            "dataAttribute" : true
        }
    ],
    "events" : [
        {
            "name" : "click",
            "type" : "click"
        }
    ],
    "addDefaults" : true,
    "parentType" : "",
    "settings" : {
        "behavior" : {
            "enableActivate" : false,
            "enableOver" : false,
            "enableOn" : false
        }
    },

    "style" : function () {
        //set CSS styles for control
        if (!this.wrap) {
            this.dom.node.style.whiteSpace = "nowrap";
            this.dom.node.style.textOverflow = "ellipsis";
            this.dom.node.style.overflow = "hidden";
        }
    },
    "update" : function() {
        this.dom.node.innerHTML = this.text;
    },
    "mouseDown" : function() {
        this.events.fire("click", null);
    }
};

define(function(fact, pkx, module, configuration) {
    return {
        "definition" : Label.prototype,
        "type" : Label
    }
});