import { Request } from "express";
import { Types } from "mongoose";
import { Availability_Enum } from "../enum/post.enum";

export const AvailabilityPost = (req: Request) => {
  return {
    $or: [
      { availability: Availability_Enum.public },
      { availability: Availability_Enum.only_me, createdBy: req?.user?._id! },
      {
        availability: Availability_Enum.friends,
        createdBy: { $in: [...(req.user?.friends || []), req.user?._id!] },
      },
      { tags: { $in: [req.user?._id] } },
    ],
  };
};

/** Facebook-style home feed: posts from you and friends that pass visibility rules */
export const feedPostFilter = (req: Request) => {
  const me = req.user?._id!;
  const network = [me, ...(req.user?.friends || [])];
  return {
    $and: [AvailabilityPost(req), { createdBy: { $in: network } }],
  };
};

export function profilePostsFilter(params: {
  viewerId: Types.ObjectId;
  profileUserId: Types.ObjectId;
  isFriend: boolean;
}) {
  const { viewerId, profileUserId, isFriend } = params;
  if (viewerId.equals(profileUserId)) {
    return { createdBy: profileUserId };
  }
  const visibility: Record<string, unknown>[] = [
    { availability: Availability_Enum.public, createdBy: profileUserId },
  ];
  if (isFriend) {
    visibility.push({
      availability: Availability_Enum.friends,
      createdBy: profileUserId,
    });
  }
  return { $or: visibility };
}
