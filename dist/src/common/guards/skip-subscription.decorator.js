"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkipSubscriptionCheck = exports.SKIP_SUBSCRIPTION_CHECK = void 0;
const common_1 = require("@nestjs/common");
exports.SKIP_SUBSCRIPTION_CHECK = 'skipSubscriptionCheck';
const SkipSubscriptionCheck = () => (0, common_1.SetMetadata)(exports.SKIP_SUBSCRIPTION_CHECK, true);
exports.SkipSubscriptionCheck = SkipSubscriptionCheck;
//# sourceMappingURL=skip-subscription.decorator.js.map