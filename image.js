var type;

function Image(pkx, module, configuration) {
}
Image.prototype = {
    "name" : "Image",
    "version" : "1.0",
    "spec" : "SKCS-02-R0",
    "attributes" : [
        {
            "name" : "url",
            "property" : "url",
            "type" : "url"
        },
        {
            "name" : "sizeMode",
            "property" : "sizeMode",
            "type" : "string"
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
    "update" : function() {
        if (this.url != null && this.url != "") {
            this.dom.node.style.backgroundImage = "url('" + this.url + "')";
        }
        else if (this.dom.node.style.backgroundImage != "") {
            this.dom.node.style.backgroundImage = "";
        }
        switch(this.sizeMode) {
            case null:
            case "":
            case "normal":
                this.dom.node.style.backgroundSize = "";
                break;
            case "contain":
            case "cover":
                this.dom.node.style.backgroundSize = this.sizeMode;
                break;
            default:
                throw "Unsupported size mode: '" + this.sizeMode + "'.";

        }
        this.dom.node.style.backgroundRepeat = "no-repeat";
    },
    "mouseDown" : function() {
        this.events.fire("click", null);
    }
};

define(function(fact, pkx, module, configuration) {
    type = type || require("cc.type");

    return {
        "definition" : Image.prototype,
        "type" : Image
    }
});