# Todo Manager+

A simple todo manager with SvelteKit and Firebase hosted on Vercel (https://todo-manager-plus.vercel.app/)

## TODO

- Issue:
    - `currentUserStore.subscribe(updateLoginStatus)`
        - Fires with null on page load when:
            - logged in, on refresh of page
        - Solved with `setTimeout()`