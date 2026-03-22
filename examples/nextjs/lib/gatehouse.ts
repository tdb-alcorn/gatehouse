import { createGatehouse } from "gatehouse";

export const gh = createGatehouse({
  roles: {
    owner: ["*"],
    admin: ["project:*", "member:invite", "member:remove", "settings:read"],
    member: ["project:read", "project:create", "task:*", "attachment:upload"],
    viewer: ["project:read", "task:read"],
  },
});
