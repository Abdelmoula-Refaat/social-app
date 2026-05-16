"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedPostFilter = exports.AvailabilityPost = void 0;
exports.profilePostsFilter = profilePostsFilter;
const post_enum_1 = require("../enum/post.enum");
const AvailabilityPost = (req) => {
    return [
        { availability: post_enum_1.Availability_Enum.public },
        { availability: post_enum_1.Availability_Enum.only_me, createdBy: req?.user?._id },
        {
            availability: post_enum_1.Availability_Enum.friends,
            createdBy: { $in: [...(req.user?.friends || []), req.user?._id] },
        },
        { tags: { $in: [req.user?._id] } },
    ];
};
exports.AvailabilityPost = AvailabilityPost;
const feedPostFilter = (req) => {
    const me = req.user?._id;
    const network = [me, ...(req.user?.friends || [])];
    return {
        $and: [(0, exports.AvailabilityPost)(req), { createdBy: { $in: network } }],
    };
};
exports.feedPostFilter = feedPostFilter;
function profilePostsFilter(params) {
    const { viewerId, profileUserId, isFriend } = params;
    if (viewerId.equals(profileUserId)) {
        return { createdBy: profileUserId };
    }
    const visibility = [
        { availability: post_enum_1.Availability_Enum.public, createdBy: profileUserId },
    ];
    if (isFriend) {
        visibility.push({
            availability: post_enum_1.Availability_Enum.friends,
            createdBy: profileUserId,
        });
    }
    return { $or: visibility };
}
