"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hash = Hash;
exports.Compare = Compare;
const bcrypt_1 = require("bcrypt");
const config_service_1 = require("../../../config/config.service");
function Hash({ plain_text, salt_rounds = config_service_1.SALT_ROUNDS }) {
    return (0, bcrypt_1.hashSync)(plain_text.toString(), Number(salt_rounds));
}
function Compare({ plain_text, cipher_text, }) {
    return (0, bcrypt_1.compareSync)(plain_text, cipher_text);
}
