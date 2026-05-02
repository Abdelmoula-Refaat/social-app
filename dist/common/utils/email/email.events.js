"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventEmitter = void 0;
const node_events_1 = require("node:events");
const email_enum_1 = require("../../enum/email.enum");
exports.eventEmitter = new node_events_1.EventEmitter();
exports.eventEmitter.on(email_enum_1.EmailEnum.confirmEmail, async (fn) => {
    await fn();
});
