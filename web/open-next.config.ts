import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every page is rendered per request (force-dynamic), so no cache is set up.
export default defineCloudflareConfig();
