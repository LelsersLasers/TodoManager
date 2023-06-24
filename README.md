# Todo Manager+

A simple todo manager with SvelteKit and Firebase hosted on Vercel

## TODO

### Errors

- `POST https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?VER=8&database=projects%2Ftodo-manager-lelserslasers%2Fdatabases%2F(default)&gsessionid=Fu-LzcRDu_bzbnREv2rgiDsF44jhC9dzmFRVr9AGYJA&SID=ucy1FKgjqmwuWgCWEPqZbw&RID=86269&TYPE=terminate&zx=3tm8rmoe55he net::ERR_BLOCKED_BY_CLIENT`
    - Brave browser only
- `popup.ts:285 Cross-Origin-Opener-Policy policy would block the window.closed call.`
    - Despite: `setHeaders({'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'});`