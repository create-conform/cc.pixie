function Pixie(pkx, module, configuration) {
    var self = this;

    //
    // DEPENDENCIES
    //
    var type = require("cc.type");
    var host = require("cc.host");
    var io = require("cc.io");
    var starfox = require("cc.starfox");
    var controlBase = require("cc.pixie/control-base.js");

    //
    // CONSTANTS
    //
    this.ERROR_INVALID_CONTROL = "pixie-error-invalid-control";

    //
    // PRIVATES
    //
    var controls = [];
    var rootNode = document.body;

    //
    // PUBLICS
    //
    this.registerControl = function(control) {
        var wrapped = {
            "definition" : type.merge(control.definition, controlBase.definition),
            "type" : function() {
                // create new instance of control base and use that as prototype for control
                var def = { "definition" : control.definition, "type" : control.type, "instance" : null };
                control.type.prototype = new controlBase.type(def);
                // instantiate new control
                def.instance = new control.type();
                // return the control base
                return control.type.prototype;
            }
        };

        // apply default configuration to control
        // TODO

        // register controls with starfox
        starfox.registerControl(wrapped);

        // add to collection
        controls.push(wrapped);

        // fire control-created event
        // TODO
    };

    //
    // INIT
    //
    // set container div for fullScreen displaying
    rootNode = document.createElement("div");
    rootNode.style.width = "100%";
    rootNode.style.height = "100%";
    rootNode.style.display = "table";
    document.body.appendChild(rootNode);
    // set root node of base control
    controlBase.rootNode = rootNode;
    // load config
    // TODO
    //if (config != null) {
    //    if (config.ui != null) {
    //        if (config.ui.defaultTheme != null) {
    //            baseControl.DEFAULT_THEME = config.ui.defaultTheme;
    //        }
    //    }
    //}
    // register all built-in controls
    [
        require("cc.pixie/button.js"),
        require("cc.pixie/panel.js"),
        require("cc.pixie/split.js"),
        require("cc.pixie/label.js"),
        require("cc.pixie/image.js"),
        require("cc.pixie/group.js"),
        require("cc.pixie/bar.js"),
        require("cc.pixie/bar-menu.js"),
        require("cc.pixie/bar-menu-item.js"),
        require("cc.pixie/bar-item.js"),
        require("cc.pixie/bar-group.js")
    ].map(self.registerControl);

    //
    // DEBUG
    //
    starfox.load("pkx:///cc.pixie.0.2.0/test/test.xml").then().catch(console.error);
}

var singleton;
define(function() {
    if (!singleton) {
        singleton = new (Function.prototype.bind.apply(Pixie, arguments));
    }

    return singleton;
});

//DEBUG
try {
    define.cache.get().factory();
}
catch(e) {
    console.error(e);
}