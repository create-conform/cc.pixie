function Button(pkx, module, configuration) {
}
Button.prototype = {
    "name" : "Button",
    "version" : "1.0",
    "spec" : "SKCS-02-R0",
    "containers" : [

    ],
    "attributes" : [
        {
            "name" : "text",
            "property" : "text",
            "type" : "string"
        },
        {
            "name" : "style",
            "property" : "style",
            "type" : "string",
            "dataAttribute" : true
        },
        {
            "name" : "icon",
            "property" : "icon",
            "type" : "url"
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
            "dummy" : false,
            "enableClick" : true
        }
    },
    "update" : function() {
        this.dom.node.innerHTML = this.text;
    }
};

define(function(pkx, module, configuration) {
    return {
        "definition" : Button.prototype,
        "type" : Button
    }
});