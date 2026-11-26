# Personal Hub deployment

The current frontend is deployed as a static application with GitHub Pages from `main`:

`https://ericren1.github.io/ai-scheduler-app/`

`.github/workflows/deploy-pages.yml` installs locked dependencies, runs tests and lint, builds the site, uploads only `frontend/dist`, and deploys through GitHub's Pages environment. Deployment requires all validation steps to succeed. The publishing job alone receives Pages-write and OIDC permissions; the build has read-only repository permissions. No provider tokens, server secrets, or paid hosting account are required. Pages must be enabled with build type `workflow` in repository settings. Manual workflow dispatch is also available.

## Paths and routes

Run `npm run build:pages` in `frontend` to build with Vite base `/ai-scheduler-app/`. BrowserRouter uses `import.meta.env.BASE_URL`, keeping local development at `/` and hosted navigation under the repository prefix. `scripts/prepare-pages.mjs` creates physical entry files for `/tasks/`, `/goals/`, and `/settings/` from the built root HTML, allowing direct visits and refreshes without a server rewrite or hash routing. Add an entry here when adding a new route. Unknown paths retain GitHub Pages' normal 404 behavior.

Ordinary `npm run build` remains suitable for root-hosted static deployments. The route-entry copies are generated build artifacts and are not committed. GitHub Pages may redirect a bare route to its trailing-slash form before loading it.

## Personal data and access

The hosted application shell is public. There is currently no account login, database, or cloud synchronization. Calendar records and preferences remain in each visitor's browser localStorage, not in GitHub or the deployed files. Development sample controls and fixtures are excluded from production builds.

The hosted origin is separate from localhost. To move existing local records, open the local app, choose **Settings → Backup → Download JSON backup**, then open the hosted app and restore that file after reviewing its preview. This transfers tasks, sessions, and schedule preferences; appearance is selected separately. Keep your downloaded backup. Different devices/browser profiles do not share records. Deploying updated code does not intentionally clear saved storage; future storage-contract changes must preserve migration/recovery behavior.

## Verify and update

1. Check the **Deploy Personal Hub** and **Frontend CI** runs for the pushed commit.
2. Visit the site, open Tasks and Settings, and refresh each route. All should load under `/ai-scheduler-app/`.
3. In a separate test browser/profile, create a task and session, refresh, verify completion/editing/deletion, and download/restore a backup. Do not clear real user storage for testing.
4. Check dark/light themes and a narrow viewport. Production should not show Dev sample controls.
5. Future authorized pushes to `main` trigger validation and deployment automatically. A failed build/test leaves the last successful site deployed. View the Pages environment for release history; a rollback requires rebuilding/redeploying a known-good commit and must be authorized, without force-pushing or resetting history.

Do not treat this static deployment as the authenticated, synchronized product described in the full PRD. Those capabilities require a later backend/authentication increment.
