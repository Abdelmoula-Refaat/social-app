"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.On_Model_Enum = exports.Availability_Enum = exports.Allow_Comment_Enum = void 0;
var Allow_Comment_Enum;
(function (Allow_Comment_Enum) {
    Allow_Comment_Enum["allow"] = "allow";
    Allow_Comment_Enum["disallow"] = "disallow";
})(Allow_Comment_Enum || (exports.Allow_Comment_Enum = Allow_Comment_Enum = {}));
var Availability_Enum;
(function (Availability_Enum) {
    Availability_Enum["public"] = "public";
    Availability_Enum["friends"] = "friends";
    Availability_Enum["only_me"] = "only_me";
})(Availability_Enum || (exports.Availability_Enum = Availability_Enum = {}));
var On_Model_Enum;
(function (On_Model_Enum) {
    On_Model_Enum["Post"] = "Post";
    On_Model_Enum["Comment"] = "Comment";
})(On_Model_Enum || (exports.On_Model_Enum = On_Model_Enum = {}));
